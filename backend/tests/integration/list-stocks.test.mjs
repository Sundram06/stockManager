// The batched holdings list must return exactly what the per-stock version did,
// with one History query instead of one per stock.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import { legacyListStocksForUser } from "../fixtures/legacy-list-stocks.mjs";

const { History, Stock } = await import("../../src/models/index.mjs");
const { listStocksForUser } = await import("../../src/services/stock.service.mjs");

let mongo;

// Deterministic pseudo-random numbers, so a failure can be reproduced.
const random = (seed) => () => {
	seed = (seed * 1103515245 + 12345) % 2147483648;
	return seed / 2147483648;
};

async function seedPortfolio(userId, rand, stockCount) {
	for (let s = 0; s < stockCount; s += 1) {
		const stock = await Stock.create({ userId, stockName: `SYM${s}`, quantity: 0, avgPrice: 0 });
		const lotCount = 1 + Math.floor(rand() * 6);
		const dormant = rand() < 0.25;
		for (let l = 0; l < lotCount; l += 1) {
			const quantity = 1 + Math.floor(rand() * 50);
			const sold = dormant ? quantity : Math.floor(rand() * (quantity + 1));
			// Shared dates on purpose: same-day lots exercise the tie order.
			const day = 1 + Math.floor(rand() * 5);
			await History.create({
				userId,
				stockId: stock._id,
				quantity,
				avgPrice: Math.round(rand() * 500000) / 100 + 0.01,
				date: new Date(Date.UTC(2025, 0, day)),
				...(sold > 0 && { quantitySold: sold }),
			});
		}
	}
}

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
	await Promise.all([Stock.init(), History.init()]);
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongo?.stop();
});

beforeEach(async () => {
	await Promise.all([Stock.deleteMany({}), History.deleteMany({})]);
});

describe("listStocksForUser", () => {
	it("matches the per-stock version exactly on 20 random portfolios", async () => {
		for (let seed = 1; seed <= 20; seed += 1) {
			await Promise.all([Stock.deleteMany({}), History.deleteMany({})]);
			const rand = random(seed);
			const userId = new mongoose.Types.ObjectId();
			const otherUser = new mongoose.Types.ObjectId();
			await seedPortfolio(userId, rand, 1 + Math.floor(rand() * 12));
			await seedPortfolio(otherUser, rand, 3);

			const expected = await legacyListStocksForUser({ Stock, History }, String(userId));
			const actual = await listStocksForUser(String(userId));

			expect(actual, `seed ${seed}`).toEqual(expected);
		}
	});

	it("returns an empty list for a user with no stocks", async () => {
		expect(await listStocksForUser(String(new mongoose.Types.ObjectId()))).toEqual([]);
	});

	it("reads all lots in a single query, however many stocks there are", async () => {
		const userId = new mongoose.Types.ObjectId();
		await seedPortfolio(userId, random(99), 15);

		const queries = [];
		mongoose.set("debug", (collection, method) => queries.push(`${collection}.${method}`));
		try {
			await listStocksForUser(String(userId));
		} finally {
			mongoose.set("debug", false);
		}

		expect(queries.filter((q) => q.startsWith("histories."))).toEqual(["histories.find"]);
		expect(queries.filter((q) => q.startsWith("stocks."))).toEqual(["stocks.find"]);
	});
});
