import { WebSocketServer } from "ws";
import { marketCache } from "../services/market-cache.service.mjs";
import { subscriptionService } from "../services/subscription.service.mjs";
import { resolveAuthToken } from "../services/auth-token.service.mjs";
import { listHeldSymbols } from "../services/stock.service.mjs";
import { portfolioEvents } from "../services/portfolio-events.mjs";
import { logInfo, logError } from "../utils/logger.mjs";

// The only client message is { type: "auth", token }; anything larger is refused
// by ws before it is read, so an anonymous socket cannot make the server buffer it.
const MAX_MESSAGE_BYTES = 4 * 1024;
const AUTH_TIMEOUT_MS = 5000;
const UNAUTHORIZED = 4001;

let wss = null;
let stopListening = () => {};

/** Cached prices for the symbols this client's user holds. */
const feedsFor = (symbols) => {
	const feeds = {};
	for (const [key, data] of Object.entries(marketCache.getAll())) {
		const symbol = subscriptionService.symbolForKey(key);
		if (symbols.has(symbol)) feeds[symbol] = { ltp: data.ltp, cp: data.cp };
	}
	return feeds;
};

const sendSnapshot = (client) => {
	const feeds = feedsFor(client.symbols);
	if (Object.keys(feeds).length > 0) client.send(JSON.stringify({ type: "snapshot", feeds }));
};

const loadSymbols = async (client) => {
	client.symbols = new Set(await listHeldSymbols(client.userId));
};

const authenticate = async (client, data, authTimeout) => {
	client.authenticating = true;
	try {
		const msg = JSON.parse(data);
		const userId = msg?.type === "auth" && typeof msg.token === "string" ? await resolveAuthToken(msg.token) : null;
		if (!userId) {
			client.close(UNAUTHORIZED, "Unauthorized");
			return;
		}
		client.userId = userId;
		await loadSymbols(client);
		client.authenticated = true;
		clearTimeout(authTimeout);
		logInfo("Frontend WS client authenticated", { clients: wss.clients.size });
		sendSnapshot(client);
	} catch {
		client.close(UNAUTHORIZED, "Unauthorized");
	} finally {
		client.authenticating = false;
	}
};

export const initInternalWebSocket = (httpServer) => {
	wss = new WebSocketServer({ server: httpServer, path: "/ws/market-data", maxPayload: MAX_MESSAGE_BYTES });

	wss.on("connection", (client) => {
		client.authenticated = false;
		client.symbols = new Set();

		const authTimeout = setTimeout(() => {
			if (!client.authenticated) client.close(UNAUTHORIZED, "Unauthorized");
		}, AUTH_TIMEOUT_MS);

		client.on("message", (data) => {
			// Only the first message counts; clients send nothing after auth.
			if (client.authenticated || client.authenticating) return;
			authenticate(client, data, authTimeout);
		});

		client.on("close", () => {
			clearTimeout(authTimeout);
			logInfo("Frontend WS client disconnected", { clients: wss.clients.size });
		});

		client.on("error", (err) => {
			logError("Frontend WS client error", { message: err.message });
		});
	});

	// Each price goes only to clients whose user holds that stock.
	const onPrice = (instrumentKey, data) => {
		if (wss.clients.size === 0) return;
		const symbol = subscriptionService.symbolForKey(instrumentKey);
		const msg = JSON.stringify({ type: "ltp_update", feeds: { [symbol]: { ltp: data.ltp, cp: data.cp } } });
		for (const client of wss.clients) {
			if (client.readyState === client.OPEN && client.authenticated && client.symbols.has(symbol)) {
				client.send(msg);
			}
		}
	};

	// A newly added stock: reload that user's symbols and send what is already cached.
	const onHoldingsChanged = async (userId) => {
		for (const client of wss.clients) {
			if (!client.authenticated || client.userId !== userId) continue;
			try {
				await loadSymbols(client);
				if (client.readyState === client.OPEN) sendSnapshot(client);
			} catch (err) {
				logError("Could not refresh live-price symbols", { message: err.message });
			}
		}
	};

	marketCache.on("update", onPrice);
	const stopHoldings = portfolioEvents.onHoldingsChanged(onHoldingsChanged);
	stopListening = () => {
		marketCache.off("update", onPrice);
		stopHoldings();
	};

	return wss;
};

export const closeInternalWebSocket = () => {
	stopListening();
	wss?.close();
};
