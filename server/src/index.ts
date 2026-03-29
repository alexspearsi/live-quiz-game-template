import { type WebSocket, WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import { connections, games, sessions } from './store';
import { CreateGameRequest, JoinGameRequest, RegRequest, StartGameRequest, SubmitAnswerRequest, UpdatePlayersBroadcastResponse } from './types';
import { broadcastToGame } from './utils/broadcast-to-game';
import { registerHandler } from './handlers/register-handler';
import { createGameHandler } from './handlers/create-game-handler';
import { joinGameHandler } from './handlers/join-game-handler';
import { startGameHandler } from './handlers/start-game-handler';
import { answerHandler } from './handlers/answer-handler';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
  console.log(`WebSocket server started at ws://localhost:${PORT}`);
});

wss.on("connection", (connection: WebSocket) => {
  const connectionId: string = randomUUID();

  connections.set(connectionId, connection)

  connection.on('message', (message) => {
    const parsed = JSON.parse(message.toString());

    switch (parsed.type) {
      case "reg":
        registerHandler(connection, parsed as RegRequest);
        break;
      case 'create_game':
        createGameHandler(connection, parsed as CreateGameRequest);
        break;
      case 'join_game':
        joinGameHandler(connection, parsed as JoinGameRequest);
        break;
      case 'start_game':
        startGameHandler(connection, parsed as StartGameRequest);
        break;
      case 'answer':
        answerHandler(connection, parsed as SubmitAnswerRequest);
        break;
    }
  })

  connection.on('close', () => {
    const userId = sessions.get(connection);

    if (userId) {
      for (const game of Object.values(games)) {
        const playerIndex = game.players.findIndex(p => p.index === userId);

        if (playerIndex !== -1) {
          game.players.splice(playerIndex, 1);

          broadcastToGame(game, {
            type: 'update_players',
            data: game.players.map(p => ({ name: p.name, index: p.index, score: p.score })),
            id: 0,
          } as UpdatePlayersBroadcastResponse);

          break;
        }
      }
    }

    connections.delete(connectionId);
    sessions.delete(connection);
  })
})