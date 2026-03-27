import { type WebSocket, WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import { connections } from './store';
import { RegRequest } from './types';
import { registerHandler } from './handlers/register-handler';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (connection: WebSocket) => {
  const connectionId: string = randomUUID();

  connections.set(connectionId, connection)

  console.log(`New connection: ${connectionId}`);

  connection.on('message', (message) => {
    try {
      console.log(`message: ${message}`);
      const parsed = JSON.parse(message.toString());

      switch (parsed.type) {
        case "reg":
          registerHandler(connection, parsed as RegRequest);
          break;
      }
    } catch(e) {
      console.log(e);
      console.log('Invalid JSON');
    }
  })
})