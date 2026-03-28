import WebSocket from "ws";
import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { randomUUID } from "crypto";
import { getAnalyticsToken } from "./analytics-token.provider.mjs";
import { marketCache } from "../services/market-cache.service.mjs";
import { subscriptionService } from "../services/subscription.service.mjs";
import { logInfo, logError } from "../utils/logger.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.resolve(
	__dirname,
	"../../node_modules/upstox-js-sdk/dist/feeder/proto/MarketDataFeed.proto",
);

const AUTHORIZE_URL =
	"https://api.upstox.com/v3/feed/market-data-feed/authorize";

// Backoff delays in ms: 1s, 5s, 10s, 30s, 60s
const BACKOFF_DELAYS = [1000, 5000, 10000, 30000, 60000];

let ws = null;
let protobufRoot = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isShuttingDown = false;

const initProtobuf = async () => {
	protobufRoot = await protobuf.load(PROTO_PATH);
	logInfo("Protobuf initialized");
};

const decodeMessage = (buffer) => {
	if (!protobufRoot) return null;
	const FeedResponse = protobufRoot.lookupType(
		"com.upstox.marketdatafeeder.rpc.proto.FeedResponse",
	);
	return FeedResponse.decode(buffer);
};

const getAuthorizedUrl = async () => {
	const token = getAnalyticsToken();
	const res = await fetch(AUTHORIZE_URL, {
		headers: {
			Authorization: `Bearer ${token}`,
			Accept: "application/json",
		},
	});
	if (!res.ok) {
		throw new Error(`Authorize request failed: ${res.status} ${res.statusText}`);
	}
	const json = await res.json();
	return json.data.authorized_redirect_uri;
};

const sendSubscription = (instrumentKeys) => {
	if (!ws || ws.readyState !== WebSocket.OPEN || instrumentKeys.length === 0) return;
	const msg = {
		guid: randomUUID(),
		method: "sub",
		data: { mode: "ltpc", instrumentKeys },
	};
	ws.send(Buffer.from(JSON.stringify(msg)));
	logInfo("Subscribed to instruments", { count: instrumentKeys.length });
};

const handleMessage = (data) => {
	// Text frames are JSON (e.g. market_info). Binary frames are protobuf.
	if (typeof data === "string") {
		try {
			const msg = JSON.parse(data);
			if (msg.type === "market_info") {
				logInfo("Market status received", { segmentStatus: msg.marketInfo?.segmentStatus });
			}
		} catch { /* ignore */ }
		return;
	}

	const decoded = decodeMessage(data);
	if (!decoded) return;

	// toJSON converts enums to string names (e.g. "live_feed") and int64 to strings
	const obj = decoded.toJSON();

	// Both initial_feed (snapshot on connect) and live_feed (price updates) carry LTP data
	if ((obj.type === "initial_feed" || obj.type === "live_feed") && obj.feeds) {
		for (const [instrumentKey, feedData] of Object.entries(obj.feeds)) {
			const ltpc = feedData.ltpc;
			if (!ltpc || ltpc.ltp == null) continue;
			marketCache.updateLTP(instrumentKey, {
				ltp: ltpc.ltp,
				cp: ltpc.cp ?? 0,
			});
		}
	}
};

const scheduleReconnect = () => {
	if (isShuttingDown) return;
	const delay = BACKOFF_DELAYS[Math.min(reconnectAttempts, BACKOFF_DELAYS.length - 1)];
	reconnectAttempts++;
	logInfo("Scheduling Upstox WebSocket reconnect", { delayMs: delay, attempt: reconnectAttempts });
	reconnectTimer = setTimeout(() => connect(), delay);
};

export const connect = async () => {
	if (isShuttingDown) return;

	try {
		if (!protobufRoot) await initProtobuf();

		const wsUrl = await getAuthorizedUrl();
		ws = new WebSocket(wsUrl);

		ws.on("open", () => {
			logInfo("Upstox WebSocket connected");
			reconnectAttempts = 0;
			// Subscribe to all currently active instruments (handles initial connect + reconnects)
			const keys = subscriptionService.getActiveKeys();
			if (keys.length > 0) sendSubscription(keys);
		});

		ws.on("message", handleMessage);

		ws.on("close", (code) => {
			logInfo("Upstox WebSocket closed", { code });
			ws = null;
			if (code !== 1000) scheduleReconnect();
		});

		ws.on("error", (err) => {
			logError("Upstox WebSocket error", { message: err.message });
		});
	} catch (err) {
		logError("Upstox WebSocket connection failed", { message: err.message });
		scheduleReconnect();
	}
};

// Subscribe to additional instrument keys on an already-open connection
export const subscribe = (instrumentKeys) => {
	sendSubscription(instrumentKeys);
};

export const disconnect = () => {
	isShuttingDown = true;
	clearTimeout(reconnectTimer);
	ws?.close(1000);
};
