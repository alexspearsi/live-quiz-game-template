import { Game } from '../types';
import { send } from './send';
import type { WebSocket } from 'ws';

export function broadcastToAll(connection: WebSocket, game: Game, payload: unknown) {
  for (const player of game.players) {
    if (player.ws.readyState === player.ws.OPEN) {
      send(player.ws, payload);
    }
  }
  send(connection, payload);
}