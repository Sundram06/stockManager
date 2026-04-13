import { History } from "../models/index.mjs";
import { applyFifoSell } from "../utils/fifo-sell.mjs";

// Recalculates all FIFO sell assignments for a stock after a backdated lot is inserted.
// Reconstructs sell events by grouping history rows by { dateSold, sellingPrice },
// resets all lots, then replays sells chronologically.
//
// Limitation: if a single lot was partially sold by multiple sell operations on the same
// date at the same price, those are merged into one event (safe approximation).
//
export async function recalculateFifoForStock(stockId, stock) {
	const allRows = await History.find({ stockId }).sort({ date: 1, _id: 1 });

	// ── Step 1: reconstruct sell events ──────────────────────────────────────
	const sellEventMap = new Map();
	for (const row of allRows) {
		if (row.quantitySold > 0 && row.dateSold) {
			const key = `${row.dateSold.toISOString()}_${row.sellingPrice}`;
			const existing = sellEventMap.get(key);
			if (existing) {
				existing.totalQty += row.quantitySold;
			} else {
				sellEventMap.set(key, {
					dateSold: row.dateSold,
					sellingPrice: row.sellingPrice,
					totalQty: row.quantitySold,
				});
			}
		}
	}

	if (sellEventMap.size === 0) return;

	const sellEvents = Array.from(sellEventMap.values())
		.sort((a, b) => new Date(a.dateSold) - new Date(b.dateSold));

	// ── Step 2: wipe all sell assignments ────────────────────────────────────
	await History.updateMany(
		{ stockId },
		{ $set: { quantitySold: 0 }, $unset: { dateSold: "", sellingPrice: "", pnl: "" } }
	);

	// ── Step 3: replay each sell in date order ────────────────────────────────
	for (const event of sellEvents) {
		const fifoRows = await History.find({
			stockId,
			date: { $lte: event.dateSold },
			$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
		}).sort({ date: 1, _id: 1 });

		if (fifoRows.length === 0) break;

		await applyFifoSell({
			fifoRows,
			quantityToSell: event.totalQty,
			sellingPrice: event.sellingPrice,
			dateSold: event.dateSold,
		});
	}

	// ── Step 4: recompute stock totals ────────────────────────────────────────
	const finalRows = await History.find({ stockId });
	let totalActiveQty = 0;
	let totalActiveCost = 0;
	for (const row of finalRows) {
		const unsoldQty = row.quantity - (row.quantitySold || 0);
		if (unsoldQty > 0) {
			totalActiveQty += unsoldQty;
			totalActiveCost += unsoldQty * row.avgPrice;
		}
	}
	stock.quantity = totalActiveQty;
	stock.avgPrice = totalActiveQty > 0
		? Number((totalActiveCost / totalActiveQty).toFixed(2))
		: 0;
	await stock.save();
}
