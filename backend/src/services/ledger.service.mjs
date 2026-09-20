import mongoose from "mongoose";
import { History, SellEvent } from "../models/index.mjs";
import { replayLedger, deriveLegacySellEvents } from "../utils/ledger.mjs";
import { logError } from "../utils/logger.mjs";

// The one place that turns a stock's buy lots + sell events into the cached
// numbers the rest of the app reads (History sell caches, SellEvent
// allocations, Stock quantity/avgPrice). Every write path goes through here.

/**
 * Runs fn inside a MongoDB transaction. Atlas is a replica set, so either
 * every write in fn lands or none does.
 */
export async function withTransaction(fn) {
	const session = await mongoose.startSession();
	try {
		let result;
		await session.withTransaction(async () => {
			result = await fn(session);
		});
		return result;
	} finally {
		await session.endSession();
	}
}

/**
 * Loads a stock's ledger. Stocks created before the ledger have sells only as
 * caches on History rows; for those, sell events are derived the way the old
 * recalculation did and flagged `pendingInsert` so persistReplay inserts them. Nothing
 * is written here.
 */
export async function loadLedger(stockId, session = null) {
	const lots = await History.find({ stockId }).sort({ date: 1, _id: 1 }).session(session);
	let events = await SellEvent.find({ stockId }).sort({ date: 1, _id: 1 }).session(session);
	let derived = false;

	if (events.length === 0 && lots.some((row) => row.quantitySold > 0)) {
		derived = true;
		events = deriveLegacySellEvents(lots).map((e) => ({
			_id: new mongoose.Types.ObjectId(),
			date: e.date,
			quantity: e.quantity,
			price: e.price,
			source: "MIGRATED_DERIVED",
			pendingInsert: true,
		}));
	}

	return { lots, events, derived };
}

export function replayFor({ lots, events }) {
	return replayLedger({
		lots: lots.map((row) => ({
			id: row._id,
			date: row.date,
			quantity: row.quantity,
			avgPrice: row.avgPrice,
		})),
		sells: events.map((e) => ({ id: e._id, date: e.date, quantity: e.quantity, price: e.price })),
	});
}

/**
 * Writes a replay result: lot caches, sell events (inserting new or derived
 * ones, rewriting allocations on existing ones), and stock quantity/avgPrice.
 */
export async function persistReplay({ stock, userId, lots, events, result, session = null }) {
	const lotState = new Map(result.lots.map((l) => [l.id, l]));
	const sellState = new Map(result.sells.map((s) => [s.id, s]));

	const historyOps = lots.map((row) => {
		const s = lotState.get(String(row._id));
		if (s && s.quantitySold > 0) {
			return {
				updateOne: {
					filter: { _id: row._id },
					update: {
						$set: {
							quantitySold: s.quantitySold,
							sellingPrice: s.sellingPrice,
							dateSold: s.dateSold,
							pnl: s.pnl,
						},
					},
				},
			};
		}
		return {
			updateOne: {
				filter: { _id: row._id },
				update: { $set: { quantitySold: 0 }, $unset: { dateSold: "", sellingPrice: "", pnl: "" } },
			},
		};
	});
	if (historyOps.length) await History.bulkWrite(historyOps, { session });

	const toAllocations = (sell) =>
		(sell?.allocations ?? []).map((a) => ({
			historyId: new mongoose.Types.ObjectId(a.lotId),
			quantity: a.quantity,
			buyPrice: a.buyPrice,
			pnl: a.pnl,
		}));

	const sellOps = events.map((e) => {
		const sell = sellState.get(String(e._id));
		const allocations = toAllocations(sell);
		const pnl = sell?.pnl ?? 0;
		if (e.pendingInsert) {
			return {
				insertOne: {
					document: {
						_id: e._id,
						userId: userId ?? stock.userId,
						stockId: stock._id,
						date: e.date,
						quantity: e.quantity,
						price: e.price,
						source: e.source ?? "MANUAL",
						...(e.externalTradeId && { externalTradeId: e.externalTradeId }),
						...(e.importBatchId && { importBatchId: e.importBatchId }),
						allocations,
						pnl,
					},
				},
			};
		}
		return { updateOne: { filter: { _id: e._id }, update: { $set: { allocations, pnl } } } };
	});
	if (sellOps.length) await SellEvent.bulkWrite(sellOps, { session });

	stock.quantity = result.remainingQuantity;
	stock.avgPrice =
		result.remainingQuantity > 0
			? Number((result.remainingCost / result.remainingQuantity).toFixed(2))
			: 0;
	await stock.save({ session });
}

/**
 * Replays a stock's whole ledger and writes the result. Used after any change
 * that can move FIFO allocations (a new lot, a backdated lot). A shortfall
 * here means stored data is already inconsistent; nothing is written and the
 * existing caches are left as they were.
 */
export async function rebuildStockLedger(stock, session = null) {
	const { lots, events } = await loadLedger(stock._id, session);
	const result = replayFor({ lots, events });
	if (result.shortfall) {
		logError("Ledger replay shortfall; caches left unchanged", {
			stockId: String(stock._id),
			shortfall: result.shortfall,
		});
		return { ok: false, shortfall: result.shortfall };
	}
	await persistReplay({ stock, lots, events, result, session });
	return { ok: true };
}

export const INCONSISTENT_HISTORY_MESSAGE =
	"This stock's history has a sale dated before the shares were bought. Fix the dates in its history first.";

class InconsistentLedgerError extends Error {}

/**
 * Saves a new buy lot and replays the ledger, all-or-nothing. If the stock's
 * existing history can't be replayed (a legacy sale dated before its
 * purchase), the lot is not saved and a 409 is returned, matching recordSell.
 */
export async function addLotAndRebuild(stock, history) {
	try {
		await withTransaction(async (session) => {
			await history.save({ session });
			const rebuilt = await rebuildStockLedger(stock, session);
			if (!rebuilt.ok) throw new InconsistentLedgerError();
		});
		return { ok: true };
	} catch (err) {
		if (err instanceof InconsistentLedgerError) {
			return { error: INCONSISTENT_HISTORY_MESSAGE, statusCode: 409 };
		}
		throw err;
	}
}

/**
 * Records one sale. Validates by replaying the ledger with the sale added, so
 * a sell that would leave any sale unfilled (including a backdated one that
 * starves a later sale) is rejected before anything is written.
 */
export async function recordSell({ stock, userId, date, quantity, price, source = "MANUAL", session = null }) {
	const { lots, events } = await loadLedger(stock._id, session);

	// If the ledger can't be replayed even before this sale, the stored
	// history is inconsistent (typically a sale dated before its purchase,
	// written by the pre-ledger code). Say so instead of "not enough stock".
	if (events.length && replayFor({ lots, events }).shortfall) {
		return { error: INCONSISTENT_HISTORY_MESSAGE, statusCode: 409 };
	}

	const newEvent = {
		_id: new mongoose.Types.ObjectId(),
		date,
		quantity,
		price,
		source,
		pendingInsert: true,
	};
	const allEvents = [...events, newEvent];
	const result = replayFor({ lots, events: allEvents });

	if (result.shortfall) {
		return { error: "Not enough stock to sell", statusCode: 400 };
	}

	await persistReplay({ stock, userId, lots, events: allEvents, result, session });

	const sell = result.sells.find((s) => s.id === String(newEvent._id));
	const touched = new Set(sell.allocations.map((a) => a.lotId));
	const updatedRows = await History.find({ _id: { $in: [...touched] } }).session(session);
	return {
		message: "Stock sold using FIFO",
		totalPnl: sell.pnl,
		updatedRows,
		sellEventId: newEvent._id,
	};
}
