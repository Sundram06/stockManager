import mongoose from "mongoose";
import { AppError } from "../../errors/app-error.mjs";
import { ImportBatch, Stock } from "../../models/index.mjs";
import { loadLedger, replayFor } from "../ledger.service.mjs";
import { subscriptionService } from "../subscription.service.mjs";
import { FileFormatError, hashContent, normalizeSymbol } from "./file-format.mjs";
import { parsePortfolioFile } from "./parsers/index.mjs";
import { dedupe, tradeKey } from "./matching.mjs";

// Works out what an import would do without writing anything. Each option the
// user can pick is replayed through the ledger, so the preview shows the
// numbers a commit would write.

const { ObjectId } = mongoose.Types;
const round2 = (n) => Number(n.toFixed(2));

const toLot = (t, importBatchId) => ({
	_id: new ObjectId(),
	date: t.date,
	quantity: t.quantity,
	avgPrice: t.price,
	source: t.source,
	...(t.externalTradeId && { externalTradeId: t.externalTradeId }),
	...(t.isin && { isin: t.isin }),
	...(importBatchId && { importBatchId }),
});

const toEvent = (t, importBatchId) => ({
	_id: new ObjectId(),
	date: t.date,
	quantity: t.quantity,
	price: t.price,
	source: t.source,
	pendingInsert: true,
	...(t.externalTradeId && { externalTradeId: t.externalTradeId }),
	...(importBatchId && { importBatchId }),
});

// Ledger order is date, then insertion order. New ObjectIds sort after stored
// ones, which is where these rows will land once inserted.
const sortLots = (lots) =>
	[...lots].sort((a, b) => new Date(a.date) - new Date(b.date) || String(a._id).localeCompare(String(b._id)));

const summarise = (lots, events, result) => ({
	quantity: result.remainingQuantity,
	avgPrice: result.remainingQuantity > 0 ? round2(result.remainingCost / result.remainingQuantity) : 0,
	realisedPnl: round2(result.sells.reduce((sum, s) => sum + s.pnl, 0)),
	lots: lots.length,
	sells: events.length,
});

const shortfallReason = (shortfall) => {
	const day = new Date(shortfall.date).toISOString().slice(0, 10);
	return `The sale of ${shortfall.requested} on ${day} needs more shares than were bought before it (only ${shortfall.filled} available).`;
};

const simulate = (lots, events) => {
	const result = replayFor({ lots, events });
	return result.shortfall
		? { ok: false, reason: shortfallReason(result.shortfall), lots, events }
		: { ok: true, after: summarise(lots, events, result), lots, events, result };
};

/** What the file would do to one stock, under each option. */
export function planStock({ stockName, trades, stored, importBatchId }) {
	const fileBuys = trades.filter((t) => t.side === "BUY");
	const fileSells = trades.filter((t) => t.side === "SELL");
	const withKey = trades.find((t) => t.instrumentKey);
	const instrumentKey =
		stored?.stock.instrumentKey || withKey?.instrumentKey || subscriptionService.keyForSymbol(stockName) || undefined;

	const replace = simulate(
		sortLots(fileBuys.map((t) => toLot(t, importBatchId))),
		fileSells.map((t) => toEvent(t, importBatchId)),
	);

	if (!stored) {
		return {
			stockName,
			instrumentKey,
			exists: false,
			status: replace.ok ? "new" : "invalid",
			file: { lots: fileBuys.length, sells: fileSells.length },
			duplicates: { lots: 0, sells: 0 },
			adds: { lots: fileBuys.length, sells: fileSells.length },
			before: null,
			options: { keep: { ok: true, after: null }, merge: replace, replace },
			defaultChoice: replace.ok ? "merge" : "keep",
		};
	}

	const beforeResult = replayFor(stored);
	const before = beforeResult.shortfall ? null : summarise(stored.lots, stored.events, beforeResult);

	const buys = dedupe(fileBuys, stored.lots, (row) => tradeKey(row.date, row.quantity, row.avgPrice));
	const sells = dedupe(fileSells, stored.events, (e) => tradeKey(e.date, e.quantity, e.price));
	const nothingNew = buys.fresh.length === 0 && sells.fresh.length === 0;

	const merge = simulate(
		sortLots([...stored.lots, ...buys.fresh.map((t) => toLot(t, importBatchId))]),
		[...stored.events, ...sells.fresh.map((t) => toEvent(t, importBatchId))],
	);
	if (!before) {
		merge.ok = false;
		merge.reason = "Your saved history for this stock has a sale dated before the shares were bought.";
	}

	let status = "merge";
	if (nothingNew) status = "unchanged";
	else if (!merge.ok) status = "conflict";

	return {
		stockName,
		instrumentKey,
		exists: true,
		stock: stored.stock,
		status,
		file: { lots: fileBuys.length, sells: fileSells.length },
		duplicates: { lots: buys.duplicates, sells: sells.duplicates },
		adds: { lots: buys.fresh.length, sells: sells.fresh.length },
		before,
		options: { keep: { ok: true, after: before }, merge, replace },
		defaultChoice: nothingNew ? "keep" : merge.ok ? "merge" : null,
	};
}

function parseOrThrow(content) {
	try {
		return parsePortfolioFile(content);
	} catch (err) {
		if (err instanceof FileFormatError) throw new AppError(err.message, 400);
		throw err;
	}
}

/** The whole file against the whole portfolio. Writes nothing. */
export async function planImport(userId, content, { session = null, importBatchId } = {}) {
	const parsed = parseOrThrow(content);

	const byName = new Map();
	for (const t of parsed.trades) {
		if (!byName.has(t.stockName)) byName.set(t.stockName, []);
		byName.get(t.stockName).push(t);
	}

	const userStocks = await Stock.find({ userId }).session(session);
	const storedByName = new Map(userStocks.map((s) => [normalizeSymbol(s.stockName), s]));

	const stocks = [];
	for (const [stockName, trades] of byName) {
		const stock = storedByName.get(stockName);
		const stored = stock ? { stock, ...(await loadLedger(stock._id, session)) } : null;
		stocks.push(planStock({ stockName: stock?.stockName ?? stockName, trades, stored, importBatchId }));
	}

	const untouched = userStocks
		.filter((s) => !byName.has(normalizeSymbol(s.stockName)))
		.map((s) => ({ stockName: s.stockName, quantity: s.quantity ?? 0, stock: s }));

	return { source: parsed.source, exportedAt: parsed.exportedAt, fileHash: hashContent(content), stocks, untouched };
}

// The plan holds Mongoose documents the commit needs, which must not reach
// the client.
const publicOption = (opt) => (opt.ok ? { ok: true, after: opt.after } : { ok: false, reason: opt.reason });

export async function previewImport(userId, { fileName, content }) {
	const plan = await planImport(userId, content);
	const previous = await ImportBatch.findOne({ userId, fileHash: plan.fileHash, status: "COMMITTED" })
		.select("createdAt fileName")
		.lean();

	return {
		fileName: fileName ?? "",
		source: plan.source,
		exportedAt: plan.exportedAt,
		alreadyImported: previous ? { batchId: previous._id, createdAt: previous.createdAt } : null,
		stocks: plan.stocks.map((s) => ({
			stockName: s.stockName,
			exists: s.exists,
			status: s.status,
			file: s.file,
			duplicates: s.duplicates,
			adds: s.adds,
			before: s.before,
			options: {
				keep: publicOption(s.options.keep),
				merge: publicOption(s.options.merge),
				replace: publicOption(s.options.replace),
			},
			defaultChoice: s.defaultChoice,
		})),
		untouched: plan.untouched.map(({ stockName, quantity }) => ({ stockName, quantity })),
	};
}
