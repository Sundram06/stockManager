import { createServer } from "http";
import connectMongo from "./models/connection.mjs";
import { extractData } from "../assets/extractData.mjs";
import { env } from "./config/env.mjs";
import { createApp } from "./app.mjs";
import {
	connect as connectUpstox,
	disconnect as disconnectUpstox,
	subscribe,
} from "./providers/upstox-websocket.provider.mjs";

import {
	initInternalWebSocket,
	closeInternalWebSocket,
} from "./websocket/market-data.websocket.mjs";
import { subscriptionService } from "./services/subscription.service.mjs";
import { fetchAndCacheLTP } from "./services/market-quote.service.mjs";
import { logInfo, logError } from "./utils/logger.mjs";

const start = async () => {
	await connectMongo();
	extractData();

	const app = createApp();
	const httpServer = createServer(app);

	initInternalWebSocket(httpServer);

	httpServer.listen(env.PORT, () => {
		logInfo("Server running", { port: env.PORT });
	});

	// Wire subscription changes (new stock added) → subscribe on WS + seed LTP via REST
	subscriptionService.onSubscriptionChange((keys) => {
		subscribe(keys);
		fetchAndCacheLTP(keys);
	});

	// Sync active instruments from DB, seed last-known LTP via REST, then open WebSocket
	try {
		const keys = await subscriptionService.syncFromDB();
		logInfo("Subscription sync complete", { instruments: keys.length });
		// Seed cache with last traded prices so dashboard shows data even on market-off days
		await fetchAndCacheLTP(keys);
		// WebSocket connects and subscribes for live updates during market hours
		await connectUpstox();
	} catch (err) {
		logError("Failed to initialize market data feed", { message: err.message });
	}

	const shutdown = () => {
		logInfo("Shutting down...");
		disconnectUpstox();
		closeInternalWebSocket();
		httpServer.close(() => process.exit(0));
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
};

start().catch((err) => {
	console.error("Server failed to start:", err);
	process.exit(1);
});
