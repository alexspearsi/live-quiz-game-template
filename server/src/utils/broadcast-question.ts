import { Game } from '../types';
import { finishQuestion } from './finish-question';
import { send } from './send';
import type { WebSocket } from 'ws';

export function broadcastQuestion(connection: WebSocket, game: Game) {
  const question = game.questions[game.currentQuestion];

  for (const player of game.players) {
    if (player.ws.readyState === player.ws.OPEN) {

      send(player.ws, {
        type: "question",
        data: {
          questionNumber: game.currentQuestion + 1,
          totalQuestions: game.questions.length,
          text: question.text,
          options: question.options,
          timeLimitSec: question.timeLimitSec,
        },
        id: 0,
      });

    }
  }

  send(connection, {
    type: "question",
    data: {
      questionNumber: game.currentQuestion + 1,
      totalQuestions: game.questions.length,
      text: question.text,
      options: question.options,
      timeLimitSec: question.timeLimitSec,
    },
    id: 0,
  });

  game.questionStartTime = Date.now();
  game.playerAnswers = new Map();

  game.questionTimer = setTimeout(() => finishQuestion(connection, game), question.timeLimitSec * 1000);
}