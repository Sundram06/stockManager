// Export → import round trips and the import pipeline, against a real
// (in-memory) MongoDB replica set so transactions and undo actually run.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";

vi.mock("../../src/services/market-calendar.service.mjs", () => ({
	checkTradingDate: async () => ({ allowed: true }),
}));

const { History, ImportBatch, SellEvent, Stock } = await import("../../src/models/index.mjs");
const { createStockForUser } = await import("../../src/services/stock.service.mjs");
const { createHistory, sellHistory } = await import("../../src/services/history.service.mjs");
const { buildBackup, buildHoldingsCsv, buildTransactionsCsv } = await import("../../src/services/export.service.mjs");
const { previewImport } = await import("../../src/services/transfer/plan.service.mjs");
const { commitImport } = await import("../../src/services/transfer/commit.service.mjs");
const { listImports, undoImport } = await import("../../src/services/transfer/batches.service.mjs");

const d = (s) => new Date(`${s}T00:00:00.000Z`);
const alice = new mongoose.Types.ObjectId();
const bob = new mongoose.Types.ObjectId();
let replset;

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

async function buy(userId, name, date, quantity, price) {
	const existing = await Stock.findOne({ userId, stockName: name });
	if (existing) {
		return createHistory(userId, { stockId: String(existing._id), quantity, avgPrice: price, date: d(date) });
	}
	return createStockForUser(userId, { stockName: name, quantity, avgPrice: price, date: d(date) });
}

async function sell(userId, name, date, quantity, price) {
	const stock = await Stock.findOne({ userId, stockName: name });
	const res = await sellHistory(userId, { stockId: stock._id, quantity, avgPrice: price, date: d(date) });
	if (res.error) throw new Error(res.error);
	return res;
}

/** Everything a user would see, without database ids. */
async function portfolioOf(userId) {
	const stocks = await Stock.find({ userId }).sort({ stockName: 1 }).lean();
	const out = {};
	for (const s of stocks) {
		const lots = await History.find({ stockId: s._id }).sort({ date: 1, _id: 1 }).lean();
		const events = await SellEvent.find({ stockId: s._id }).sort({ date: 1, _id: 1 }).lean();
		out[s.stockName] = {
			quantity: s.quantity,
			avgPrice: s.avgPrice,
			lots: lots.map((l) => [l.date.toISOString(), l.quantity, l.avgPrice, l.quantitySold ?? 0, l.pnl ?? 0]),
			sells: events.map((e) => [
				e.date.toISOString(),
				e.quantity,
				e.price,
				e.pnl,
				e.allocations.map((a) => [a.quantity, a.buyPrice, a.pnl]),
			]),
		};
	}
	return out;
}

async function seedAlice() {
	// One lot sold in two parts, at two different dates and prices: the case a
	// blended-cache export would get wrong.
	await buy(alice, "INFY", "2025-01-02", 10, 100);
	await buy(alice, "INFY", "2025-01-02", 5, 110);
	await buy(alice, "INFY", "2025-03-03", 8, 150);
	await sell(alice, "INFY", "2025-02-03", 6, 130);
	await sell(alice, "INFY", "2025-04-01", 7, 90);
	await buy(alice, "TCS", "2025-01-05", 4, 3000);
	await sell(alice, "TCS", "2025-06-02", 4, 3500);
	await buy(alice, "HDFCBANK", "2025-02-10", 20, 1600);
}

const fileOf = async (userId) => JSON.stringify(await buildBackup(userId));

describe("export → import round trip", () => {
	it("restores every lot, every sale and every P&L figure exactly", async () => {
		await seedAlice();
		const content = await fileOf(alice);

		const preview = await previewImport(bob, { fileName: "backup.json", content });
		expect(preview.stocks.map((s) => [s.stockName, s.status])).toEqual([
			["HDFCBANK", "new"],
			["INFY", "new"],
			["TCS", "new"],
		]);

		const { batch } = await commitImport(bob, { fileName: "backup.json", content });
		expect(batch.stocks.created).toBe(3);
		expect(await portfolioOf(bob)).toEqual(await portfolioOf(alice));

		// And the restored portfolio exports to the same facts.
		const again = JSON.parse(await fileOf(bob));
		const original = JSON.parse(content);
		const facts = (f) => f.stocks.map(({ stockName, lots, sells, summary }) => ({ stockName, lots, sells, summary }));
		expect(facts(again)).toEqual(facts(original));
	});

	it("re-importing a backup into the same account changes nothing", async () => {
		await seedAlice();
		const before = await portfolioOf(alice);
		const content = await fileOf(alice);

		const preview = await previewImport(alice, { content });
		expect(preview.stocks.every((s) => s.status === "unchanged")).toBe(true);

		const res = await commitImport(alice, { content });
		expect(res.batch).toBeNull();
		expect(await portfolioOf(alice)).toEqual(before);
		expect(await ImportBatch.countDocuments()).toBe(0);
	});

	it("flags a file that was already imported", async () => {
		await seedAlice();
		const content = await fileOf(alice);
		await commitImport(bob, { content });
		const preview = await previewImport(bob, { content });
		expect(preview.alreadyImported).not.toBeNull();
	});
});

describe("merging into an existing portfolio", () => {
	it("adds only the trades that aren't already there", async () => {
		await seedAlice();
		const content = await fileOf(alice);
		// Bob already has the first INFY buy, typed in by hand.
		await buy(bob, "INFY", "2025-01-02", 10, 100);

		const preview = await previewImport(bob, { content });
		const infy = preview.stocks.find((s) => s.stockName === "INFY");
		expect(infy).toMatchObject({
			status: "merge",
			duplicates: { lots: 1, sells: 0 },
			adds: { lots: 2, sells: 2 },
		});
		expect(infy.options.merge.after).toMatchObject({ quantity: 10, lots: 3, sells: 2 });

		await commitImport(bob, { content });
		expect((await portfolioOf(bob)).INFY).toEqual((await portfolioOf(alice)).INFY);
	});

	it("blocks a merge that would oversell and requires a choice", async () => {
		// The same 10 shares, sold on different dates in the file and in the app:
		// merging would sell 20 shares out of 10.
		await buy(alice, "SBIN", "2025-01-01", 10, 500);
		await sell(alice, "SBIN", "2025-02-01", 10, 600);
		const file = await fileOf(alice);
		await buy(bob, "SBIN", "2025-01-01", 10, 500);
		await sell(bob, "SBIN", "2025-01-15", 10, 550);

		const preview = await previewImport(bob, { content: file });
		const sbin = preview.stocks[0];
		expect(sbin.status).toBe("conflict");
		expect(sbin.defaultChoice).toBeNull();
		expect(sbin.options.merge.ok).toBe(false);
		expect(sbin.options.merge.reason).toMatch(/needs more shares/);

		const bobBefore = await portfolioOf(bob);
		await expect(commitImport(bob, { content: file })).rejects.toMatchObject({ statusCode: 409 });
		expect(await portfolioOf(bob)).toEqual(bobBefore);

		// Choosing "keep" is allowed and writes nothing.
		const res = await commitImport(bob, { content: file, choices: { SBIN: "keep" } });
		expect(res.batch).toBeNull();
	});
});

describe("undo", () => {
	it("puts a replaced stock back exactly as it was", async () => {
		await seedAlice();
		const content = await fileOf(alice);
		await buy(bob, "INFY", "2024-12-01", 3, 80);
		await sell(bob, "INFY", "2024-12-20", 1, 85);
		const before = await portfolioOf(bob);
		const rawBefore = await History.find({ userId: bob }).sort({ _id: 1 }).lean();

		const { batch } = await commitImport(bob, { content, choices: { INFY: "replace" } });
		expect(batch.stocks).toMatchObject({ created: 2, replaced: 1 });
		expect((await portfolioOf(bob)).INFY).toEqual((await portfolioOf(alice)).INFY);

		await undoImport(bob, batch.id);
		expect(await portfolioOf(bob)).toEqual(before);
		// Same documents, same ids: anything pointing at them still works.
		expect(await History.find({ userId: bob }).sort({ _id: 1 }).lean()).toEqual(rawBefore);

		const [listed] = await listImports(bob);
		expect(listed).toMatchObject({ status: "UNDONE", canUndo: false });
		await expect(undoImport(bob, batch.id)).rejects.toMatchObject({ statusCode: 409 });
	});

	it("refuses when a stock changed after the import", async () => {
		await seedAlice();
		const { batch } = await commitImport(bob, { content: await fileOf(alice) });
		await buy(bob, "HDFCBANK", "2025-05-01", 1, 1700);

		await expect(undoImport(bob, batch.id)).rejects.toThrow(/HDFCBANK changed after this import/);
		expect(await Stock.countDocuments({ userId: bob })).toBe(3);
	});

	it("won't undo another user's import", async () => {
		await seedAlice();
		const { batch } = await commitImport(bob, { content: await fileOf(alice) });
		await expect(undoImport(alice, batch.id)).rejects.toMatchObject({ statusCode: 404 });
	});
});

describe("replace everything", () => {
	it("needs typed confirmation, removes stocks not in the file, and undoes cleanly", async () => {
		await seedAlice();
		const content = await fileOf(alice);
		await buy(bob, "WIPRO", "2025-01-01", 10, 400);
		const before = await portfolioOf(bob);

		await expect(commitImport(bob, { content, replaceAll: true })).rejects.toMatchObject({ statusCode: 400 });

		const { batch } = await commitImport(bob, { content, replaceAll: true, confirmReplaceAll: "REPLACE" });
		expect(batch.stocks).toMatchObject({ created: 3, deleted: 1 });
		expect(await portfolioOf(bob)).toEqual(await portfolioOf(alice));

		await undoImport(bob, batch.id);
		expect(await portfolioOf(bob)).toEqual(before);
	});
});

describe("file checks", () => {
	it.each([
		["not json", "hello", /isn't valid JSON/],
		["another app", JSON.stringify({ app: "zerodha", stocks: [] }), /isn't a VittNest backup/],
		["newer version", JSON.stringify({ app: "vittnest", schemaVersion: 99, stocks: [] }), /newer version/],
		[
			"bad date",
			JSON.stringify({
				app: "vittnest",
				schemaVersion: 1,
				stocks: [{ stockName: "INFY", lots: [{ date: "31-02-2025", quantity: 1, price: 1 }] }],
			}),
			/not a valid date/,
		],
	])("rejects %s with a readable message", async (_label, content, message) => {
		await expect(previewImport(bob, { content })).rejects.toMatchObject({ statusCode: 400, message: expect.stringMatching(message) });
	});
});

describe("CSV export", () => {
	it("keeps each sale on its own row with its own P&L", async () => {
		await seedAlice();
		const csv = await buildTransactionsCsv(alice);
		const rows = csv.trim().split("\r\n");
		expect(rows[0]).toBe("Date,Symbol,Type,Quantity,Price,Amount,Realised P&L");
		// Same-day lots (10 @ 100, 5 @ 110) are consumed pro-rata: 4 + 2.
		expect(rows).toContain("2025-02-03,INFY,SELL,6,130,780,160");
		expect(rows.filter((r) => r.includes(",SELL,"))).toHaveLength(3);
	});

	it("leaves price columns empty when there's no live price", async () => {
		await seedAlice();
		const rows = (await buildHoldingsCsv(alice)).trim().split("\r\n");
		expect(rows).toContain("HDFCBANK,20,1600,32000,,,,0");
		expect(rows.join()).not.toMatch(/undefined|null|NaN/);
	});
});
