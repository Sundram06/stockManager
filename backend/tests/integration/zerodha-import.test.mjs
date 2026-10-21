// Importing a Zerodha tradebook over a portfolio that was typed in by hand.
// The risk this covers is a trade counted twice: the broker records the real
// fill time and exact price, the user recorded midnight and a round number.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

vi.mock("../../src/services/market-calendar.service.mjs", () => ({
	checkTradingDate: async () => ({ allowed: true }),
}));

const { History, ImportBatch, SellEvent, Stock } = await import("../../src/models/index.mjs");
const { createStockForUser } = await import("../../src/services/stock.service.mjs");
const { createHistory, sellHistory } = await import("../../src/services/history.service.mjs");
const { previewImport } = await import("../../src/services/transfer/plan.service.mjs");
const { commitImport } = await import("../../src/services/transfer/commit.service.mjs");
const { undoImport } = await import("../../src/services/transfer/batches.service.mjs");

const userId = new mongoose.Types.ObjectId();
const d = (s) => new Date(`${s}T00:00:00.000Z`);
let replset;

const HEADER =
	"symbol,isin,trade_date,exchange,segment,series,trade_type,auction,quantity,price,trade_id,order_id,order_execution_time";

const row = ({ symbol = "INFY", date = "2025-01-06", side = "buy", qty = 10, price = 1500, tradeId = "1", orderId = "O1", time }) =>
	[symbol, "INE009A01021", date, "NSE", "EQ", "EQ", side, "false", qty, price, tradeId, orderId, time ?? `${date}T10:42:33`].join(",");

const tradebook = (...rows) => [HEADER, ...rows].join("\n");

beforeAll(async () => {
	replset = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
	await mongoose.connect(replset.getUri());
	await Promise.all([History.init(), SellEvent.init(), Stock.init(), ImportBatch.init()]);
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await replset?.stop();
});

beforeEach(async () => {
	await Promise.all([
		History.deleteMany({}),
		SellEvent.deleteMany({}),
		Stock.deleteMany({}),
		ImportBatch.deleteMany({}),
	]);
});

const stockNamed = (name) => Stock.findOne({ userId, stockName: name });
const lotsOf = async (name) => History.find({ stockId: (await stockNamed(name))._id }).sort({ date: 1 }).lean();

describe("importing a Zerodha tradebook", () => {
	it("adds trades to an empty portfolio", async () => {
		const content = tradebook(row({}), row({ date: "2025-03-03", qty: 5, price: 1620, tradeId: "2", orderId: "O2" }));

		const preview = await previewImport(userId, { fileName: "tradebook.csv", content });
		expect(preview.source).toBe("ZERODHA");
		expect(preview.stocks[0]).toMatchObject({ stockName: "INFY", status: "new", adds: { lots: 2, sells: 0 } });

		await commitImport(userId, { fileName: "tradebook.csv", content });

		const lots = await lotsOf("INFY");
		expect(lots.map((l) => [l.quantity, l.avgPrice, l.source])).toEqual([
			[10, 1500, "ZERODHA"],
			[5, 1620, "ZERODHA"],
		]);
		expect((await stockNamed("INFY")).quantity).toBe(15);
	});

	it("corrects a hand-typed trade instead of adding a second one", async () => {
		// Typed by hand: 10 at a round 1500, dated midnight.
		await createStockForUser(userId, { stockName: "INFY", quantity: 10, avgPrice: 1500, date: d("2025-01-06") });

		const content = tradebook(row({ price: 1500.25 }));
		const preview = await previewImport(userId, { content });
		const infy = preview.stocks[0];

		expect(infy.adds).toEqual({ lots: 0, sells: 0 });
		expect(infy.corrections).toHaveLength(1);
		expect(infy.corrections[0]).toMatchObject({ stockName: "INFY", side: "BUY", quantity: 10 });
		expect(infy.corrections[0].to.price).toBe(1500.25);

		await commitImport(userId, { content });

		const lots = await lotsOf("INFY");
		expect(lots).toHaveLength(1);
		expect(lots[0].avgPrice).toBe(1500.25);
		expect(lots[0].date.toISOString()).toBe("2025-01-06T05:12:33.000Z");
		expect(lots[0].externalTradeId).toBe("zerodha:2025-01-06:1");
	});

	it("matches one hand-typed trade against the order's separate fills", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 100, avgPrice: 1500, date: d("2025-01-06") });

		const content = tradebook(
			row({ qty: 60, price: 1500.2, tradeId: "1", orderId: "O1" }),
			row({ qty: 25, price: 1500.35, tradeId: "2", orderId: "O1" }),
			row({ qty: 15, price: 1500.1, tradeId: "3", orderId: "O1" }),
		);

		const preview = await previewImport(userId, { content });
		expect(preview.stocks[0].adds).toEqual({ lots: 0, sells: 0 });
		expect(preview.stocks[0].corrections[0]).toMatchObject({ quantity: 100, fills: 3 });

		await commitImport(userId, { content });

		const lots = await lotsOf("INFY");
		expect(lots).toHaveLength(1);
		expect(lots[0].quantity).toBe(100);
		// Weighted average of the three fills.
		expect(lots[0].avgPrice).toBe(1500.22);
	});

	it("leaves a trade alone when two stored trades could be the match", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 10, avgPrice: 1500, date: d("2025-01-06") });
		const stock = await stockNamed("INFY");
		await createHistory(userId, { stockId: String(stock._id), quantity: 10, avgPrice: 1500, date: d("2025-01-06") });

		const preview = await previewImport(userId, { content: tradebook(row({ price: 1500.25 })) });

		// Two identical stored buys that day: picking one would be a guess.
		expect(preview.stocks[0].corrections).toHaveLength(0);
		expect(preview.stocks[0].adds).toEqual({ lots: 1, sells: 0 });
	});

	it("does not match a trade on a different day or a different quantity", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 10, avgPrice: 1500, date: d("2025-01-07") });

		const preview = await previewImport(userId, { content: tradebook(row({ price: 1500.25 })) });

		expect(preview.stocks[0].corrections).toHaveLength(0);
		expect(preview.stocks[0].adds).toEqual({ lots: 1, sells: 0 });
	});

	it("does not match when the price is further off than the tolerance", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 10, avgPrice: 1500, date: d("2025-01-06") });

		const preview = await previewImport(userId, { content: tradebook(row({ price: 1700 })) });

		expect(preview.stocks[0].corrections).toHaveLength(0);
		expect(preview.stocks[0].adds).toEqual({ lots: 1, sells: 0 });
	});

	it("corrects a sale the same way, and the realised P&L moves with it", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 10, avgPrice: 1500, date: d("2025-01-06") });
		const stock = await stockNamed("INFY");
		await sellHistory(userId, { stockId: stock._id, quantity: 4, avgPrice: 1700, date: d("2025-02-10") });

		const content = tradebook(
			row({ price: 1500 }),
			row({ date: "2025-02-10", side: "sell", qty: 4, price: 1712.5, tradeId: "9", orderId: "O9" }),
		);

		const preview = await previewImport(userId, { content });
		expect(preview.stocks[0].before.realisedPnl).toBe(800);
		expect(preview.stocks[0].options.merge.after.realisedPnl).toBe(850);

		await commitImport(userId, { content });

		const sells = await SellEvent.find({ stockId: stock._id }).lean();
		expect(sells).toHaveLength(1);
		expect(sells[0]).toMatchObject({ quantity: 4, price: 1712.5, pnl: 850 });
	});

	it("changes nothing when the same tradebook is imported twice", async () => {
		const content = tradebook(row({}), row({ date: "2025-02-10", side: "sell", qty: 4, price: 1700, tradeId: "9", orderId: "O9" }));
		await commitImport(userId, { content });
		const after = await lotsOf("INFY");

		const preview = await previewImport(userId, { content });
		expect(preview.stocks[0].status).toBe("unchanged");

		const second = await commitImport(userId, { content });
		expect(second.batch).toBeNull();
		expect(await lotsOf("INFY")).toEqual(after);
	});

	it("recognises the order again after a correction, without duplicating it", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 100, avgPrice: 1500, date: d("2025-01-06") });
		const content = tradebook(
			row({ qty: 60, price: 1500.2, tradeId: "1", orderId: "O1" }),
			row({ qty: 40, price: 1500.3, tradeId: "2", orderId: "O1" }),
		);

		await commitImport(userId, { content });
		const preview = await previewImport(userId, { content });

		expect(preview.stocks[0].status).toBe("unchanged");
		expect(preview.stocks[0].duplicates).toEqual({ lots: 2, sells: 0 });
		expect(await lotsOf("INFY")).toHaveLength(1);
	});

	it("puts a corrected trade back as it was on undo", async () => {
		await createStockForUser(userId, { stockName: "INFY", quantity: 10, avgPrice: 1500, date: d("2025-01-06") });
		const before = await lotsOf("INFY");

		const { batch } = await commitImport(userId, { content: tradebook(row({ price: 1500.25 })) });
		expect((await lotsOf("INFY"))[0].avgPrice).toBe(1500.25);

		await undoImport(userId, batch.id);

		expect(await lotsOf("INFY")).toEqual(before);
	});

	it("reports derivatives as skipped rather than importing them", async () => {
		const content = tradebook(
			row({}),
			"NIFTY25JANFUT,,2025-01-06,NFO,FO,,buy,false,50,21000,99,O9,2025-01-06T11:00:00",
		);

		const preview = await previewImport(userId, { content });

		expect(preview.skipped).toMatchObject({ segment: 1 });
		expect(preview.stocks).toHaveLength(1);
	});
});
