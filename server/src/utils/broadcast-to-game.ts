import { Game } from '../types';
import { send } from './send';
import { WebSocket } from 'ws';

export function broadcastToGame(game: Game, payload: unknown) {
  for (const player of game.players) {
    if (player.ws.readyState === WebSocket.OPEN) {
      send(player.ws, payload)
    }
  }
}