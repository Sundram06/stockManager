// The live-price socket: who may connect, and which prices each user is sent.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import mongoose from "mongoose";
import WebSocket from "ws";
import { MongoMemoryServer } from "mongodb-memory-server-core";

process.env.JWT_SECRET = "test-secret";

const { User, Stock } = await import("../../src/models/index.mjs");
const { initInternalWebSocket, closeInternalWebSocket } = await import("../../src/websocket/market-data.websocket.mjs");
const { marketCache } = await import("../../src/services/market-cache.service.mjs");
const { portfolioEvents } = await import("../../src/services/portfolio-events.mjs");
const { issueAuthToken, revokeAuthTokens } = await import("../../src/services/auth-token.service.mjs");

// Real keys from assets/instruments.json, so symbolForKey maps them to these symbols.
const INFY = "NSE_EQ|INE009A01021";
const TCS = "NSE_EQ|INE467B01029";

let mongo;
let server;
let url;
const sockets = [];

/** Opens a socket and records every message and the close code. */
const connect = () => {
	const ws = new WebSocket(url);
	const state = { ws, messages: [], closeCode: null };
	ws.on("message", (data) => state.messages.push(JSON.parse(data)));
	state.closed = new Promise((resolve) =>
		ws.on("close", (code) => {
			state.closeCode = code;
			resolve(code);
		}),
	);
	state.opened = new Promise((resolve) => ws.on("open", resolve));
	sockets.push(ws);
	return state;
};

const signIn = async (token) => {
	const client = connect();
	await client.opened;
	client.ws.send(JSON.stringify({ type: "auth", token }));
	return client;
};

const waitFor = async (check, ms = 2000) => {
	const deadline = Date.now() + ms;
	while (Date.now() < deadline) {
		if (check()) return;
		await new Promise((r) => setTimeout(r, 20));
	}
	throw new Error("condition not met in time");
};

const symbolsReceived = (client) => client.messages.flatMap((m) => Object.keys(m.feeds));

const userHolding = async (email, ...symbols) => {
	const user = await User.create({ name: "T", email, provider: "local", isEmailVerified: true });
	for (const stockName of symbols) await Stock.create({ userId: user._id, stockName, quantity: 5, avgPrice: 100 });
	return user;
};

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
	server = createServer();
	initInternalWebSocket(server);
	await new Promise((resolve) => server.listen(0, resolve));
	url = `ws://127.0.0.1:${server.address().port}/ws/market-data`;
}, 120_000);

afterAll(async () => {
	for (const ws of sockets) ws.terminate();
	closeInternalWebSocket();
	await new Promise((resolve) => server.close(resolve));
	await mongoose.disconnect();
	await mongo?.stop();
});

beforeEach(async () => {
	await Promise.all([User.deleteMany({}), Stock.deleteMany({})]);
});

describe("connecting", () => {
	it("drops an unauthenticated socket that sends more than 4 KB", async () => {
		const client = connect();
		await client.opened;
		client.ws.send(JSON.stringify({ type: "auth", token: "x".repeat(8 * 1024) }));
		expect(await client.closed).toBe(1009);
	});

	it("closes on a bad token", async () => {
		const client = await signIn("not-a-token");
		expect(await client.closed).toBe(4001);
	});

	it("closes on a token revoked by logout", async () => {
		const user = await userHolding("revoked@example.com", "INFY");
		const token = issueAuthToken(user);
		await revokeAuthTokens(user._id);

		const client = await signIn(token);
		expect(await client.closed).toBe(4001);
	});
});

describe("which prices a user receives", () => {
	it("sends each user only the prices of stocks they hold", async () => {
		const alice = await userHolding("alice@example.com", "INFY");
		const bob = await userHolding("bob@example.com", "TCS");
		const a = await signIn(issueAuthToken(alice));
		const b = await signIn(issueAuthToken(bob));
		// Both are authenticated once their (possibly empty) snapshot step is done.
		await new Promise((r) => setTimeout(r, 200));

		marketCache.updateLTP(INFY, { ltp: 1500, cp: 1490 });
		marketCache.updateLTP(TCS, { ltp: 3500, cp: 3480 });

		await waitFor(() => symbolsReceived(a).includes("INFY") && symbolsReceived(b).includes("TCS"));
		expect(symbolsReceived(a)).not.toContain("TCS");
		expect(symbolsReceived(b)).not.toContain("INFY");
	});

	it("starts sending a stock's price as soon as the user adds it", async () => {
		marketCache.updateLTP(TCS, { ltp: 3500, cp: 3480 });
		const carol = await userHolding("carol@example.com", "INFY");
		const c = await signIn(issueAuthToken(carol));
		await new Promise((r) => setTimeout(r, 200));
		expect(symbolsReceived(c)).not.toContain("TCS");

		await Stock.create({ userId: carol._id, stockName: "TCS", quantity: 2, avgPrice: 3000 });
		portfolioEvents.holdingsChanged(carol._id);

		await waitFor(() => symbolsReceived(c).includes("TCS"));
	});
});
