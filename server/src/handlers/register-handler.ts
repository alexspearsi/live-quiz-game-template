import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { users } from "../store";
import type { RegRequest, RegResponse } from "../types";
import { sessions } from '../store';
import { send } from '../utils/send';

export function registerHandler(connection: WebSocket, msg: RegRequest) {
	const { name, password } = msg.data;

	if (!name || !password) {
		return send(connection, {
			type: "reg",
			data: {
				name,
				index: '',
				error: true,
				errorText: "Name and password required",
			},
			id: 0,
		} as RegResponse);
	}

	const existingUser = users[name];

	if (!existingUser) {
		const index = randomUUID();

		users[name] = {
      name,
			password,
			index,
		};

    sessions.set(connection, index)

		return send(connection, {
			type: "reg",
			data: {
				name,
				index,
				error: false,
				errorText: "",
			},
			id: 0,
		} as RegResponse);
	}

	if (existingUser.password === password) {
    sessions.set(connection, existingUser.index)

		return send(connection, {
			type: "reg",
			data: {
				name,
				index: existingUser.index,
				error: false,
				errorText: "",
			},
			id: 0,
		} as RegResponse);
	}

	return send(connection, {
		type: "reg",
		data: {
			name,
			index: '',
			error: true,
			errorText: "Invalid password",
		},
		id: 0,
	} as RegResponse);
}
