import type { WebSocket } from 'ws';
import { games, sessions } from '../store';
import type { SubmitAnswerRequest } from '../types';
import { send } from '../utils/send';
import { finishQuestion } from '../utils/finish-question';

export function answerHandler(connection: WebSocket, msg: SubmitAnswerRequest) {
  const { gameId, questionIndex, answerIndex } = msg.data;
  const userId = sessions.get(connection);
  const game = games[gameId];

  if (!game) {
    return send(connection, {
      type: 'error',
      data: {
        error: true,
        errorText: 'Game not found',
        id: 0
      }
    })
  }

  if (game.status !== 'in_progress') {
    return send(connection, {
      type: 'error',
      data: {
        error: true,
        errorText: 'Game not in progress'
      },
      id: 0
    })
  }

  if (questionIndex !== game.currentQuestion) {
    return send(connection, {
      type: 'error',
      data: {
        error: true,
        errorText: 'Wrong question index'
      },
      id: 0
    })
  }

  const player = game.players.find((player) => player.index === userId);

  if (!player) {
    return send(connection, {
      type: 'error',
      data: {
        error: true,
        errorText: 'Player not in game',
      },
      id: 0
    })
  }

  game.playerAnswers.set(player.index, { answerIndex, timestamp: Date.now() });

  send(connection, {
    type: 'answer_accepted',
    data: { questionIndex },
    id: 0
  });

  const hostConnection = [...sessions.entries()]
    .find(([, id]) => id === game.hostId)?.[0];

  if (game.playerAnswers.size === game.players.length) {
    clearTimeout(game.questionTimer);

    game.questionTimer = undefined;
    
    finishQuestion(hostConnection!, game);
  }
}