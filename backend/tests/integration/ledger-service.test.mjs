// Service-level tests against a real (in-memory) MongoDB replica set, so the
// transaction, bulkWrite and legacy-derivation paths actually run.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

vi.mock("../../src/services/market-calendar.service.mjs", () => ({
	checkTradingDate: async () => ({ allowed: true }),
}));

const { History, SellEvent, Stock } = await import("../../src/models/index.mjs");
const { createStockForUser, deleteStockById } = await import("../../src/services/stock.service.mjs");
const { createHistory, sellHistory } = await import("../../src/services/history.service.mjs");

const d = (s) => new Date(`${s}T00:00:00.000Z`);
const userId = new mongoose.Types.ObjectId();
let replset;

beforeAll(async () => {
	replset = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
	await mongoose.connect(replset.getUri());
	await Promise.all([History.init(), SellEvent.init(), Stock.init()]);
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await replset?.stop();
});

beforeEach(async () => {
	await Promise.all([History.deleteMany({}), SellEvent.deleteMany({}), Stock.deleteMany({})]);
});

async function newStock(name, date, quantity, avgPrice) {
	await createStockForUser(userId, { stockName: name, quantity, avgPrice, date: d(date) });
	return Stock.findOne({ userId, stockName: name });
}

describe("ledger service", () => {
	it("stores two sells of one lot as two sell events", async () => {
		const stock = await newStock("INFY", "2025-01-01", 10, 100);
		await sellHistory(userId, { stockId: stock._id, quantity: 5, avgPrice: 120, date: d("2025-02-01") });
		const res = await sellHistory(userId, { stockId: stock._id, quantity: 5, avgPrice: 80, date: d("2025-03-01") });

		expect(res.totalPnl).toBe(-100);
		const events = await SellEvent.find({ stockId: stock._id }).sort({ date: 1 });
		expect(events.map((e) => [e.date.toISOString().slice(0, 10), e.quantity, e.price, e.pnl])).toEqual([
			["2025-02-01", 5, 120, 100],
			["2025-03-01", 5, 80, -100],
		]);
		const lot = await History.findOne({ stockId: stock._id });
		expect(lot).toMatchObject({ quantitySold: 10, sellingPrice: 100, pnl: 0 });
		expect((await Stock.findById(stock._id)).quantity).toBe(0);
	});

	it("re-allocates existing sells when a backdated lot is added, keeping each sale intact", async () => {
		const stock = await newStock("INFY", "2025-01-01", 10, 100);
		await sellHistory(userId, { stockId: stock._id, quantity: 5, avgPrice: 120, date: d("2025-02-01") });
		await sellHistory(userId, { stockId: stock._id, quantity: 5, avgPrice: 80, date: d("2025-03-01") });

		await createHistory(userId, { stockId: String(stock._id), quantity: 4, avgPrice: 50, date: d("2024-12-01") });

		const events = await SellEvent.find({ stockId: stock._id }).sort({ date: 1 });
		expect(events.map((e) => [e.quantity, e.price])).toEqual([[5, 120], [5, 80]]);
		expect(events[0].allocations.map((a) => [a.quantity, a.buyPrice])).toEqual([[4, 50], [1, 100]]);
		expect(events[0].pnl).toBe(300);

		const after = await Stock.findById(stock._id);
		expect(after.quantity).toBe(4);
		expect(after.avgPrice).toBe(100);
	});

	it("rejects an oversell and writes nothing", async () => {
		const stock = await newStock("TCS", "2025-01-01", 3, 100);
		const res = await sellHistory(userId, { stockId: stock._id, quantity: 5, avgPrice: 110, date: d("2025-02-01") });

		expect(res).toEqual({ error: "Not enough stock to sell", statusCode: 400 });
		expect(await SellEvent.countDocuments()).toBe(0);
		const lot = await History.findOne({ stockId: stock._id });
		expect(lot.quantitySold ?? 0).toBe(0);
	});

	it("rejects a backdated sell that would starve a later sale", async () => {
		const stock = await newStock("TCS", "2025-01-01", 10, 100);
		await createHistory(userId, { stockId: String(stock._id), quantity: 10, avgPrice: 100, date: d("2025-03-01") });
		await sellHistory(userId, { stockId: stock._id, quantity: 10, avgPrice: 110, date: d("2025-02-01") });

		// Only the January lot existed in February; a second February sell of 5
		// would need shares that weren't bought yet.
		const res = await sellHistory(userId, { stockId: stock._id, quantity: 5, avgPrice: 110, date: d("2025-02-15") });
		expect(res.statusCode).toBe(400);
		expect(await SellEvent.countDocuments()).toBe(1);
	});

	it("migrates a pre-ledger stock on its first write without changing its numbers", async () => {
		// Legacy shape: sells exist only as caches on History rows.
		const stock = await Stock.create({ userId, stockName: "RELIANCE", quantity: 6, avgPrice: 200 });
		await History.create([
			{ userId, stockId: stock._id, date: d("2025-01-01"), quantity: 10, avgPrice: 100, quantitySold: 10, sellingPrice: 150, dateSold: d("2025-02-01"), pnl: 500 },
			{ userId, stockId: stock._id, date: d("2025-01-10"), quantity: 10, avgPrice: 200, quantitySold: 4, sellingPrice: 150, dateSold: d("2025-02-01"), pnl: -200 },
		]);

		// Adding a lot dated after every sale must not move any allocation.
		await createHistory(userId, { stockId: String(stock._id), quantity: 2, avgPrice: 300, date: d("2025-05-01") });

		const events = await SellEvent.find({ stockId: stock._id });
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({ source: "MIGRATED_DERIVED", quantity: 14, price: 150, pnl: 300 });

		const lots = await History.find({ stockId: stock._id }).sort({ date: 1 });
		expect(lots.map((l) => [l.quantitySold ?? 0, l.pnl ?? 0])).toEqual([[10, 500], [4, -200], [0, 0]]);
		expect((await Stock.findById(stock._id)).quantity).toBe(8);
	});

	it("explains an inconsistent legacy history instead of saying 'not enough stock'", async () => {
		// Real shape found in production: a lot recorded as sold before it was bought.
		const stock = await Stock.create({ userId, stockName: "TCS", quantity: 5, avgPrice: 431 });
		await History.create({
			userId, stockId: stock._id, date: d("2026-03-29"), quantity: 10, avgPrice: 431,
			quantitySold: 5, sellingPrice: 2380, dateSold: d("2026-03-12"), pnl: 9745,
		});

		const res = await sellHistory(userId, { stockId: stock._id, quantity: 1, avgPrice: 2400, date: d("2026-04-01") });
		expect(res.statusCode).toBe(409);
		expect(res.error).toMatch(/sale dated before/);
		expect(await SellEvent.countDocuments()).toBe(0);
	});

	it("refuses to add a lot to an inconsistent legacy history, writing nothing", async () => {
		const stock = await Stock.create({ userId, stockName: "SUZLON", quantity: 0, avgPrice: 0 });
		await History.create({
			userId, stockId: stock._id, date: d("2025-06-01"), quantity: 100, avgPrice: 67,
			quantitySold: 100, sellingPrice: 100, dateSold: d("2025-05-13"), pnl: 3300,
		});

		const res = await createHistory(userId, { stockId: String(stock._id), quantity: 5, avgPrice: 60, date: d("2025-07-01") });
		expect(res.statusCode).toBe(409);
		expect(await History.countDocuments({ stockId: stock._id })).toBe(1);
		expect(await SellEvent.countDocuments()).toBe(0);
	});

	it("rejects an unparseable sale date instead of booking it today", async () => {
		const stock = await newStock("INFY", "2025-01-01", 10, 100);
		const res = await sellHistory(userId, { stockId: stock._id, quantity: 1, avgPrice: 110, date: "15-03-2025" });
		expect(res).toEqual({ error: "Sale date is not a valid date", statusCode: 400 });
	});

	it("does not delete another user's lots when given their stock id", async () => {
		const stock = await newStock("HDFC", "2025-01-01", 10, 100);
		await deleteStockById(new mongoose.Types.ObjectId(), stock._id);

		expect(await Stock.countDocuments({ _id: stock._id })).toBe(1);
		expect(await History.countDocuments({ stockId: stock._id })).toBe(1);
	});

	it("deleting a user account removes their stocks, lots and sells, and nobody else's", async () => {
		const { User } = await import("../../src/models/index.mjs");
		const { deleteUserAccount } = await import("../../src/services/account.service.mjs");
		const owner = await User.create({ email: "owner@example.com" });
		const other = await User.create({ email: "other@example.com" });

		await createStockForUser(owner._id, { stockName: "INFY", quantity: 10, avgPrice: 100, date: d("2025-01-01") });
		const infy = await Stock.findOne({ userId: owner._id });
		await sellHistory(owner._id, { stockId: infy._id, quantity: 4, avgPrice: 120, date: d("2025-02-01") });
		await createStockForUser(other._id, { stockName: "TCS", quantity: 5, avgPrice: 300, date: d("2025-01-01") });
		const { ImportBatch } = await import("../../src/models/index.mjs");
		await ImportBatch.create({ userId: owner._id, source: "VITTNEST", fileHash: "x" });

		expect(await deleteUserAccount(owner._id)).toBe(true);
		expect(await ImportBatch.countDocuments({ userId: owner._id })).toBe(0);

		expect(await User.countDocuments({ _id: owner._id })).toBe(0);
		expect(await Stock.countDocuments({ userId: owner._id })).toBe(0);
		expect(await History.countDocuments({ stockId: infy._id })).toBe(0);
		expect(await SellEvent.countDocuments({ stockId: infy._id })).toBe(0);
		expect(await Stock.countDocuments({ userId: other._id })).toBe(1);
		expect(await History.countDocuments({ userId: other._id })).toBe(1);
		await User.deleteMany({});
	});

	it("cascades on any Mongoose user delete, not just the service", async () => {
		const { User } = await import("../../src/models/index.mjs");
		const u = await User.create({ email: "direct@example.com" });
		await createStockForUser(u._id, { stockName: "HDFC", quantity: 3, avgPrice: 100, date: d("2025-01-01") });

		await User.deleteOne({ _id: u._id });

		expect(await Stock.countDocuments({ userId: u._id })).toBe(0);
		expect(await History.countDocuments({ userId: u._id })).toBe(0);
	});

	it("removes lots and sell events with the stock", async () => {
		const stock = await newStock("HDFC", "2025-01-01", 10, 100);
		await sellHistory(userId, { stockId: stock._id, quantity: 4, avgPrice: 120, date: d("2025-02-01") });
		await deleteStockById(userId, stock._id);

		expect(await Stock.countDocuments()).toBe(0);
		expect(await History.countDocuments()).toBe(0);
		expect(await SellEvent.countDocuments()).toBe(0);
	});
});
