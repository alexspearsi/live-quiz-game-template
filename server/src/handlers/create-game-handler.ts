import type { WebSocket } from "ws";
import { CreateGameRequest, Game, GameCreatedResponse } from '../types';
import { randomUUID } from 'node:crypto';
import { games, sessions } from '../store';
import { send } from '../utils/send';

export function createGameHandler(connection: WebSocket, msg: CreateGameRequest) {
  const { questions } = msg.data;

  if (!questions || questions.length === 0) {
    return send(connection, { 
      type: "error", 
      data: {
        error: true,
        errorText: "Questions are required"
      },
      id: 0
    })
  }

  for (const question of questions) {
    if (!question.text || !Array.isArray(question.options) || question.options.length !== 4) {
      return send(connection, {
        type: "error",
        data: {
          error: true,
          errorText: "Each question must have text and exactly 4 options"
        },
        id: 0
      })
    }

    if (question.correctIndex < 0 || question.correctIndex > 3) {
      return send(connection, {
        type: "error",
        data: {
          error: true,
          errorText: "correctIndex must be 0-3"
        },
        id: 0
      })
    }

    if (!question.timeLimitSec || question.timeLimitSec <= 0) {
      return send(connection, {
        type: "error",
        data: {
          error: true,
          errorText: "timeLimitSec must be > 0",
        },
        id: 0
      })
    }
  }

  const id: string = randomUUID();
  const code: string = randomUUID().substring(0, 6).toUpperCase()

  const game: Game = {
      id,
      code,
      hostId: sessions.get(connection)!,
      questions: msg.data.questions,
      players: [],
      currentQuestion: -1,
      status: 'waiting',
      playerAnswers: new Map()
  }

  games[id] = game;

  return send(connection, {
    type: "game_created",
    data: {
      gameId: id,
      code: code,
    },
    id: 0
  } as GameCreatedResponse)
}