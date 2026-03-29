import { games, sessions, users } from '../store';
import { Game, GameJoinedResponse, JoinGameRequest, PlayerJoinedBroadcastResponse, UpdatePlayersBroadcastResponse } from '../types';
import { broadcastToGame } from '../utils/broadcast-to-game';
import { send } from '../utils/send';
import { WebSocket } from 'ws';

export function joinGameHandler(connection: WebSocket, msg: JoinGameRequest) {
  const { code } = msg.data;

  const userId = sessions.get(connection);
  const user = Object.values(users).find(u => u.index === userId)

  if (!user) {
    return send(connection, { 
      type: "error", 
      data: { 
        error: true, 
        errorText: "Not authorized" 
      }, 
      id: 0 });
  }

  const game = Object.values(games).find(g => g.code === code);

  if (!game) {
    return send(connection, {
      type: "error",
      data: {
        error: true,
        errorText: "Game not found",
      },
      id: 0,
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
    })
  }

  game.players.push({ name: user.name, index: user.index, score: 0, ws: connection });

  send(connection, {
    type: "game_joined",
    data: {
      gameId: game.id
    },
    id: 0
  } as GameJoinedResponse)

  const playerJoinedPayload: PlayerJoinedBroadcastResponse = {
    type: "player_joined",
    data: {
      playerName: user.name,
      playerCount: game.players.length
    },
    id: 0
  }

  const updatePlayersPayload: UpdatePlayersBroadcastResponse = {
    type: "update_players",
    data: game.players.map(player => (
      { 
        name: player.name, 
        index: player.index, 
        score: player.score 
      })),
    id: 0,
  };

  const hostEntry = [...sessions.entries()].find(([ws, id]) => id === game.hostId);

  broadcastToGame(game, playerJoinedPayload);
  broadcastToGame(game, updatePlayersPayload)

  if (hostEntry) {
    send(hostEntry[0], playerJoinedPayload);
    send(hostEntry[0], updatePlayersPayload);
  }
}