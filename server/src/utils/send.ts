import type { WebSocket } from "ws";

export function send(connection: WebSocket, payload: unknown) {
	connection.send(JSON.stringify(payload));
}
