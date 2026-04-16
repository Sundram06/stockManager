import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { env } from "../config/env.mjs";
import { marketCache } from "../services/market-cache.service.mjs";
import { subscriptionService } from "../services/subscription.service.mjs";
import { logInfo, logError } from "../utils/logger.mjs";

let wss = null;

const buildSnapshot = () => {
	const all = marketCache.getAll();
	if (Object.keys(all).length === 0) return null;
	const feeds = {};
	for (const [key, data] of Object.entries(all)) {
		feeds[subscriptionService.symbolForKey(key)] = { ltp: data.ltp, cp: data.cp };
	}
	return { type: "snapshot", feeds };
};

export const initInternalWebSocket = (httpServer) => {
	wss = new WebSocketServer({ server: httpServer, path: "/ws/market-data" });

	wss.on("connection", (client) => {
		client.authenticated = false;

		// Auth timeout — close unauthenticated connections after 5s
		const authTimeout = setTimeout(() => {
			if (!client.authenticated) {
				client.close(4001, "Unauthorized");
			}
		}, 5000);

		client.on("message", (data) => {
			// First message must be { type: "auth", token }
			if (!client.authenticated) {
				try {
					const msg = JSON.parse(data);
					if (msg.type !== "auth") {
						client.close(4001, "Unauthorized");
						return;
					}
					jwt.verify(msg.token, env.JWT_SECRET);
					client.authenticated = true;
					clearTimeout(authTimeout);
					logInfo("Frontend WS client authenticated", { clients: wss.clients.size });

					// Send current LTP snapshot now that auth is confirmed
					const snapshot = buildSnapshot();
					if (snapshot) client.send(JSON.stringify(snapshot));
				} catch {
					client.close(4001, "Unauthorized");
				}
				return;
			}
			// Authenticated clients — no client→server messages expected currently
		});

		client.on("close", () => {
			clearTimeout(authTimeout);
			logInfo("Frontend WS client disconnected", { clients: wss.clients.size });
		});

		client.on("error", (err) => {
			logError("Frontend WS client error", { message: err.message });
		});
	});

	// Broadcast every LTP update from Upstox to all connected frontend clients
	marketCache.on("update", (instrumentKey, data) => {
		if (wss.clients.size === 0) return;
		const symbol = subscriptionService.symbolForKey(instrumentKey);
		const msg = JSON.stringify({
			type: "ltp_update",
			feeds: { [symbol]: { ltp: data.ltp, cp: data.cp } },
		});
		for (const client of wss.clients) {
			if (client.readyState === client.OPEN && client.authenticated) client.send(msg);
		}
	});

	return wss;
};

export const closeInternalWebSocket = () => {
	wss?.close();
};
