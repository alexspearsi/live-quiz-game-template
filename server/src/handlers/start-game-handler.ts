import type { WebSocket } from "ws";
import { games, sessions } from '../store';
import type { StartGameRequest } from "../types";
import { send } from '../utils/send';
import { broadcastQuestion } from '../utils/broadcast-question';

export function startGameHandler(connection: WebSocket, msg: StartGameRequest) {
  const { gameId } = msg.data;
  const userId = sessions.get(connection);
  const game = games[gameId];

  if (!game) {
    return send(connection, { 
      type: "error", 
      data: { 
        error: true, 
        errorText: "Game not found" 
      }, 
      id: 0 
    });
  }

  if (game.hostId !== userId) {
    return send(connection, { 
      type: "error", 
      data: { 
        error: true, 
        errorText: "Only host can start the game" 
      }, 
      id: 0 
    });
  }

  if (game.status !== 'waiting') {
    return send(connection, { 
      type: "error", 
      data: { 
        error: true, 
        errorText: "Game already started" 
      }, 
      id: 0 
    });
  }

  game.status = 'in_progress';
  game.currentQuestion = 0;

  broadcastQuestion(connection, game);
}