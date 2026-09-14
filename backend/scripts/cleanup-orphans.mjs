// Removes data nothing can reach any more.
//
//   npm run cleanup:orphans            dry run: lists what would go
//   npm run cleanup:orphans -- --apply deletes, after saving a JSON backup
//
// "Orphaned" means:
//   - stocks whose user no longer exists, plus their history and sell events;
//   - history rows and sell events whose stock no longer exists.
// Nobody can log in to see any of it, and it skews whole-database checks.
// Deletes run in one transaction; the backup file lets you restore by hand.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { History, SellEvent, Stock, User } from "../src/models/index.mjs";
import { withTransaction } from "../src/services/ledger.service.mjs";

const APPLY = process.argv.includes("--apply");

async function main() {
	await mongoose.connect(process.env.DB_URI);
	console.log(`Mode: ${APPLY ? "APPLY (deletes)" : "dry run (read only)"}\n`);

	const userIds = new Set((await User.find({}, { _id: 1 }).lean()).map((u) => String(u._id)));
	const stocks = await Stock.find({}).lean();
	const stockIds = new Set(stocks.map((s) => String(s._id)));

	const deadStocks = stocks.filter((s) => !userIds.has(String(s.userId)));
	const deadStockIds = deadStocks.map((s) => s._id);
	const deadStockIdSet = new Set(deadStockIds.map(String));

	const histories = await History.find({}).lean();
	const sellEvents = await SellEvent.find({}).lean();
	const isDead = (row) => !stockIds.has(String(row.stockId)) || deadStockIdSet.has(String(row.stockId));
	const deadHistories = histories.filter(isDead);
	const deadSellEvents = sellEvents.filter(isDead);

	console.log(`Stocks owned by a deleted user: ${deadStocks.length}`);
	for (const s of deadStocks) console.log(`    ${s.stockName} (${s._id}), user ${s.userId}`);
	console.log(`History rows to remove:         ${deadHistories.length}`);
	console.log(`    of which stock is missing:  ${histories.filter((r) => !stockIds.has(String(r.stockId))).length}`);
	console.log(`Sell events to remove:          ${deadSellEvents.length}`);

	const nothing = !deadStocks.length && !deadHistories.length && !deadSellEvents.length;
	if (nothing) console.log("\nNothing to clean.");

	if (APPLY && !nothing) {
		const dir = path.resolve("backups");
		fs.mkdirSync(dir, { recursive: true });
		const file = path.join(dir, `orphans-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
		fs.writeFileSync(
			file,
			JSON.stringify({ exportedAt: new Date().toISOString(), stocks: deadStocks, histories: deadHistories, sellEvents: deadSellEvents }, null, 2),
		);
		console.log(`\nBackup written: ${file}`);

		await withTransaction(async (session) => {
			await Stock.deleteMany({ _id: { $in: deadStockIds } }, { session });
			await History.deleteMany({ _id: { $in: deadHistories.map((r) => r._id) } }, { session });
			await SellEvent.deleteMany({ _id: { $in: deadSellEvents.map((r) => r._id) } }, { session });
		});
		console.log("Deleted.");
	}

	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error(err);
	await mongoose.disconnect();
	process.exit(1);
});
