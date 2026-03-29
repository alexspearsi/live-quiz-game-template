import type { WebSocket } from "ws";
import type { Game, User } from "../types";

export const connections = new Map<string, WebSocket>();
export const sessions = new Map<WebSocket, string>();

export const users: Record<string, User> = {};
export const games: Record<string, Game> = {};
