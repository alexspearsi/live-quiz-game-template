import type { WebSocket } from "ws";
import { CreateGameRequest, Game, GameCreatedResponse } from '../types';
import { randomUUID } from 'node:crypto';
import { games, sessions } from '../store';
import { send } from '../utils/send';

export function createGameHandler(connection: WebSocket, msg: CreateGameRequest) {

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