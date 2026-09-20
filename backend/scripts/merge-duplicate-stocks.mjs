// Merges duplicate Stock documents (same user + same symbol) into one.
//
//   npm run merge:duplicate-stocks            dry run
//   npm run merge:duplicate-stocks -- --apply writes, after a JSON backup
//
// The oldest document survives. Lots and sell events from the others are
// re-pointed to it, the others are deleted, and the survivor's ledger is
// replayed. A group is skipped if the merged ledger can't be replayed.
// After all groups merge cleanly, the unique {userId, stockName} index on
// Stock can be built.
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { History, SellEvent, Stock } from "../src/models/index.mjs";
import { loadLedger, persistReplay, replayFor, withTransaction } from "../src/services/ledger.service.mjs";

const APPLY = process.argv.includes("--apply");

async function main() {
	await mongoose.connect(process.env.DB_URI);
	console.log(`Mode: ${APPLY ? "APPLY (writes)" : "dry run (read only)"}\n`);

	const groups = await Stock.aggregate([
		{ $group: { _id: { userId: "$userId", stockName: "$stockName" }, ids: { $push: "$_id" }, n: { $sum: 1 } } },
		{ $match: { n: { $gt: 1 } } },
	]);
	if (!groups.length) {
		console.log("No duplicate stocks.");
		return mongoose.disconnect();
	}

	if (APPLY) {
		const allIds = groups.flatMap((g) => g.ids);
		const dir = path.resolve("backups");
		fs.mkdirSync(dir, { recursive: true });
		const file = path.join(dir, `duplicates-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
		fs.writeFileSync(
			file,
			JSON.stringify(
				{
					stocks: await Stock.find({ _id: { $in: allIds } }).lean(),
					histories: await History.find({ stockId: { $in: allIds } }).lean(),
					sellEvents: await SellEvent.find({ stockId: { $in: allIds } }).lean(),
				},
				null,
				2,
			),
		);
		console.log(`Backup written: ${file}\n`);
	}

	for (const g of groups) {
		const [survivorId, ...others] = g.ids.map(String).sort(); // ObjectIds sort by creation time
		const label = `${g._id.stockName} (user ${g._id.userId})`;

		const lotsMoved = await History.countDocuments({ stockId: { $in: others } });
		const sellsMoved = await SellEvent.countDocuments({ stockId: { $in: others } });
		console.log(`${label}: keep ${survivorId}, merge ${others.join(", ")} — ${lotsMoved} lot(s), ${sellsMoved} sell(s)`);

		if (!APPLY) continue;

		const outcome = await withTransaction(async (session) => {
			await History.updateMany({ stockId: { $in: others } }, { $set: { stockId: survivorId } }, { session });
			await SellEvent.updateMany({ stockId: { $in: others } }, { $set: { stockId: survivorId } }, { session });
			await Stock.deleteMany({ _id: { $in: others } }, { session });

			const survivor = await Stock.findById(survivorId).session(session);
			const { lots, events } = await loadLedger(survivor._id, session);
			const result = replayFor({ lots, events });
			if (result.shortfall) throw new Error(`merged ledger does not replay: ${JSON.stringify(result.shortfall)}`);
			await persistReplay({ stock: survivor, lots, events, result, session });
			return `now ${survivor.quantity} shares @ ${survivor.avgPrice}`;
		}).catch((err) => `SKIPPED, nothing changed (${err.message})`);
		console.log(`    ${outcome}`);
	}

	await mongoose.disconnect();
}

main().catch(async (err) => {
	console.error(err);
	await mongoose.disconnect();
	process.exit(1);
});
