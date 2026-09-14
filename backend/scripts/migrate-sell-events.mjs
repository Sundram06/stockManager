// Migrates pre-ledger stocks to SellEvent records.
//
//   npm run migrate:sell-events            dry run: reads only, prints a report
//   npm run migrate:sell-events -- --apply writes, after saving a JSON backup
//
// For every stock without SellEvents, sell events are derived from the History
// caches the same way the old recalculation did, the ledger is replayed, and
// the replayed numbers are compared with what is stored today. A stock is only
// migrated if the replay reproduces its stored numbers exactly; anything else
// is reported and left alone. Safe to re-run: migrated stocks are skipped.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { History, SellEvent, Stock } from "../src/models/index.mjs";
import { loadLedger, persistReplay, replayFor, withTransaction } from "../src/services/ledger.service.mjs";

const APPLY = process.argv.includes("--apply");
const BACKUP = APPLY || process.argv.includes("--backup");

const same = (a, b) => Math.abs((a ?? 0) - (b ?? 0)) < 1e-6;
const sameDate = (a, b) => (a ? new Date(a).getTime() : null) === (b ? new Date(b).getTime() : null);

function storedTotals(lots) {
	let qty = 0;
	let cost = 0;
	for (const row of lots) {
		const unsold = row.quantity - (row.quantitySold || 0);
		if (unsold > 0) {
			qty += unsold;
			cost += unsold * row.avgPrice;
		}
	}
	return { qty, avg: qty > 0 ? Number((cost / qty).toFixed(2)) : 0 };
}

// A stored lot P&L that doesn't equal quantitySold × (sellingPrice − avgPrice)
// is wrong on its own terms. If the replay yields exactly that arithmetic, the
// difference is a correction, not a mismatch: the app would write the same
// value on the stock's next edit anyway, so the script must agree with it.
const isPnlCorrection = (row, replayed) =>
	same(replayed, parseFloat(((row.quantitySold ?? 0) * ((row.sellingPrice ?? 0) - row.avgPrice)).toFixed(2))) &&
	!same(row.pnl ?? 0, replayed);

function compare(lots, result) {
	const diffs = [];
	const corrections = [];
	const state = new Map(result.lots.map((l) => [l.id, l]));
	for (const row of lots) {
		const r = state.get(String(row._id));
		const checks = [
			["quantitySold", row.quantitySold ?? 0, r.quantitySold, same],
			["pnl", row.pnl ?? 0, r.pnl, same],
			["sellingPrice", row.quantitySold > 0 ? row.sellingPrice : 0, r.quantitySold > 0 ? r.sellingPrice : 0, same],
			["dateSold", row.quantitySold > 0 ? row.dateSold : null, r.quantitySold > 0 ? r.dateSold : null, sameDate],
		];
		for (const [field, stored, replayed, eq] of checks) {
			if (eq(stored, replayed)) continue;
			if (field === "pnl" && isPnlCorrection(row, replayed)) {
				corrections.push({ lot: String(row._id), stored, replayed, change: parseFloat((replayed - stored).toFixed(2)) });
			} else {
				diffs.push({ lot: String(row._id), field, stored, replayed });
			}
		}
	}
	const before = storedTotals(lots);
	const afterAvg =
		result.remainingQuantity > 0 ? Number((result.remainingCost / result.remainingQuantity).toFixed(2)) : 0;
	if (before.qty !== result.remainingQuantity) diffs.push({ field: "stock.quantity", stored: before.qty, replayed: result.remainingQuantity });
	if (!same(before.avg, afterAvg)) diffs.push({ field: "stock.avgPrice", stored: before.avg, replayed: afterAvg });
	return { diffs, corrections };
}

async function main() {
	await mongoose.connect(process.env.DB_URI);
	console.log(`Mode: ${APPLY ? "APPLY (writes)" : "dry run (read only)"}\n`);

	const stocks = await Stock.find({}).sort({ userId: 1, stockName: 1 });

	if (BACKUP) {
		const dir = path.resolve("backups");
		fs.mkdirSync(dir, { recursive: true });
		const file = path.join(dir, `pre-sell-events-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
		const dump = {
			exportedAt: new Date().toISOString(),
			stocks: await Stock.find({}).lean(),
			histories: await History.find({}).lean(),
			sellEvents: await SellEvent.find({}).lean(),
		};
		fs.writeFileSync(file, JSON.stringify(dump, null, 2));
		console.log(`Backup written: ${file}\n`);
	}

	const report = { alreadyMigrated: 0, noSells: 0, reproduced: [], corrected: [], mismatched: [], migrated: 0 };

	for (const stock of stocks) {
		const label = `${stock.stockName} (${stock._id})`;
		const existing = await SellEvent.countDocuments({ stockId: stock._id });
		if (existing > 0) {
			report.alreadyMigrated++;
			continue;
		}
		const { lots, events, derived } = await loadLedger(stock._id);
		if (!derived) {
			report.noSells++;
			continue;
		}
		const result = replayFor({ lots, events });
		const { diffs, corrections } = result.shortfall
			? { diffs: [{ field: "shortfall", ...result.shortfall }], corrections: [] }
			: compare(lots, result);

		if (diffs.length) {
			report.mismatched.push({ stock: label, events: events.length, diffs });
			continue;
		}
		if (corrections.length) {
			const total = corrections.reduce((sum, c) => sum + c.change, 0);
			report.corrected.push(`${label}: realised P&L ${total >= 0 ? "+" : ""}₹${total} (${JSON.stringify(corrections)})`);
		} else {
			report.reproduced.push(`${label}: ${events.length} sell event(s)`);
		}

		if (APPLY) {
			await withTransaction(async (session) => {
				const fresh = await Stock.findById(stock._id).session(session);
				await persistReplay({ stock: fresh, lots, events, result, session });
			});
			report.migrated++;
		}
	}

	// Data-quality findings that the migration does not fix.
	const duplicates = await Stock.aggregate([
		{ $group: { _id: { userId: "$userId", stockName: "$stockName" }, ids: { $push: "$_id" }, n: { $sum: 1 } } },
		{ $match: { n: { $gt: 1 } } },
	]);
	const orphans = await History.aggregate([
		{ $lookup: { from: "stocks", localField: "stockId", foreignField: "_id", as: "s" } },
		{ $match: { s: { $size: 0 } } },
		{ $count: "n" },
	]);

	console.log(`Stocks scanned:            ${stocks.length}`);
	console.log(`  no sells, nothing to do: ${report.noSells}`);
	console.log(`  already migrated:        ${report.alreadyMigrated}`);
	console.log(`  replay reproduces today: ${report.reproduced.length}`);
	for (const line of report.reproduced) console.log(`      ${line}`);
	console.log(`  P&L corrected on migrate:${report.corrected.length}`);
	for (const line of report.corrected) console.log(`      ${line}`);
	console.log(`  MISMATCH, left alone:    ${report.mismatched.length}`);
	for (const m of report.mismatched) console.log(`      ${m.stock}\n        ${JSON.stringify(m.diffs)}`);
	if (APPLY) console.log(`  migrated now:            ${report.migrated}`);
	console.log(`\nDuplicate stock docs (same user + symbol): ${duplicates.length} group(s)`);
	for (const g of duplicates) console.log(`      ${g._id.stockName}: ${g.ids.map(String).join(", ")}`);
	console.log(`History rows whose stock no longer exists: ${orphans[0]?.n ?? 0}`);

	await mongoose.disconnect();
	process.exitCode = report.mismatched.length ? 1 : 0;
}

main().catch(async (err) => {
	console.error(err);
	await mongoose.disconnect();
	process.exit(1);
});
