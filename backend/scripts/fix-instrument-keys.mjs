// Updates stocks whose stored instrument key Upstox no longer prices.
//
//   npm run fix:instrument-keys            dry run
//   npm run fix:instrument-keys -- --apply writes, after a JSON backup
//
// A key stops working when the company's ISIN changes, usually after a split
// or a face-value change. The stock is matched to Upstox's current list by its
// trading symbol. Stocks with no stored key are left alone: they are resolved
// from the live list at runtime.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { Stock } from "../src/models/index.mjs";
import { instrumentMaster, refreshFromUpstox } from "../src/services/instrument-master.service.mjs";

const APPLY = process.argv.includes("--apply");

async function main() {
	console.log(`Mode: ${APPLY ? "APPLY (writes)" : "dry run (read only)"}\n`);

	// Comparing against the bundled snapshot would "fix" good keys back to stale ones.
	if (!(await refreshFromUpstox())) {
		console.log("Could not download Upstox's instrument list, so nothing was checked.");
		return;
	}

	await mongoose.connect(process.env.DB_URI);
	const stocks = await Stock.find({ instrumentKey: { $type: "string" } }).lean();

	const fixes = [];
	const unresolved = [];
	for (const stock of stocks) {
		if (instrumentMaster.hasKey(stock.instrumentKey)) continue;
		const current = instrumentMaster.keyForSymbol(stock.stockName);
		if (current) fixes.push({ stock, current });
		else unresolved.push(stock);
	}

	console.log(`Checked ${stocks.length} stocks with a stored key.`);
	for (const { stock, current } of fixes) {
		console.log(`  ${stock.stockName.padEnd(14)} ${stock.instrumentKey}  ->  ${current}`);
	}
	for (const stock of unresolved) {
		console.log(`  ${stock.stockName.padEnd(14)} ${stock.instrumentKey}  ->  not in Upstox's list, left unchanged`);
	}
	if (!fixes.length) {
		console.log("Nothing to update.");
		return mongoose.disconnect();
	}

	if (APPLY) {
		const dir = path.resolve("backups");
		fs.mkdirSync(dir, { recursive: true });
		const file = path.join(dir, `instrument-keys-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
		fs.writeFileSync(file, JSON.stringify(fixes.map((f) => f.stock), null, 2));
		console.log(`\nBackup written: ${file}`);

		await Stock.bulkWrite(
			fixes.map(({ stock, current }) => ({
				updateOne: { filter: { _id: stock._id }, update: { $set: { instrumentKey: current } } },
			})),
		);
		console.log(`Updated ${fixes.length} stock(s).`);
	}

	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error(err);
	await mongoose.disconnect();
	process.exit(1);
});
