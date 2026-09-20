import { createHash } from "node:crypto";
import { History, SellEvent, Stock } from "../../models/index.mjs";

// What an import records about a stock, so undo can put it back and can tell
// whether doing so is still safe.

/** Everything belonging to one stock, as raw documents. */
export async function snapshot(stockId, session) {
	return {
		stock: await Stock.findById(stockId).session(session).lean(),
		lots: await History.find({ stockId }).session(session).lean(),
		events: await SellEvent.find({ stockId }).session(session).lean(),
	};
}

/**
 * A fingerprint of a stock's stored state, taken right after an import. Any buy,
 * sale or delete since then changes it, which is how undo knows to refuse.
 */
export async function fingerprint(userId, entry, session) {
	if (entry.action === "deleted") {
		return (await Stock.exists({ userId, stockName: entry.stockName }).session(session)) ? "present" : "absent";
	}
	const stock = await Stock.findById(entry.stockId).session(session).lean();
	if (!stock) return "absent";

	const lots = await History.find({ stockId: entry.stockId }).sort({ _id: 1 }).session(session).lean();
	const events = await SellEvent.find({ stockId: entry.stockId }).sort({ _id: 1 }).session(session).lean();
	const parts = [
		stock.quantity,
		stock.avgPrice,
		...lots.map((l) => [l._id, new Date(l.date).getTime(), l.quantity, l.avgPrice].join(":")),
		"|",
		...events.map((e) => [e._id, new Date(e.date).getTime(), e.quantity, e.price].join(":")),
	];
	return createHash("sha1").update(parts.join(",")).digest("hex");
}
