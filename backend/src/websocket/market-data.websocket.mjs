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

	wss.on("connection", (client, req) => {
		const url = new URL(req.url, `http://${req.headers.host}`);
		const token = url.searchParams.get("token");

		try {
			jwt.verify(token, env.JWT_SECRET);
		} catch {
			client.close(4001, "Unauthorized");
			return;
		}

		logInfo("Frontend WS client connected", { clients: wss.clients.size });

		// Send current LTP snapshot immediately on connect
		const snapshot = buildSnapshot();
		if (snapshot) client.send(JSON.stringify(snapshot));

		client.on("close", () => {
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
			if (client.readyState === client.OPEN) client.send(msg);
		}
	});

	return wss;
};

export const closeInternalWebSocket = () => {
	wss?.close();
};
