import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { AppError } from "../errors/app-error.mjs";
import { History, ImportBatch, SellEvent, Stock } from "../models/index.mjs";
import { FileFormatError, hashContent, normalizeSymbol, parsePortfolioFile } from "../utils/portfolio-file.mjs";
import { loadLedger, persistReplay, replayFor, withTransaction } from "./ledger.service.mjs";
import { subscriptionService } from "./subscription.service.mjs";

// Import pipeline: parse → group by stock → dedupe against what's stored →
// simulate every option with replayLedger → preview. Commit re-runs the plan
// against current data inside a transaction and refuses any stock whose chosen
// option no longer replays. If the portfolio changed after the preview but the
// choice still replays, the commit writes the re-planned result, whose numbers
// can differ from what the preview showed.

export const UNDO_WINDOW_DAYS = 7;
const UNDO_WINDOW_MS = UNDO_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const { ObjectId } = mongoose.Types;

const round2 = (n) => Number(n.toFixed(2));
const tradeKey = (date, quantity, price) => `${new Date(date).getTime()}|${quantity}|${price}`;

/**
 * Splits file trades into ones the ledger already has and new ones. Matching
 * is a multiset on (timestamp, quantity, price): two identical buys in the
 * file against one stored buy means one of them is new.
 */
function dedupe(fileTrades, storedRows, storedKey) {
	const counts = new Map();
	const storedIds = new Set();
	for (const row of storedRows) {
		const key = storedKey(row);
		counts.set(key, (counts.get(key) ?? 0) + 1);
		if (row.externalTradeId) storedIds.add(row.externalTradeId);
	}
	const fresh = [];
	let duplicates = 0;
	for (const t of fileTrades) {
		if (t.externalTradeId && storedIds.has(t.externalTradeId)) {
			duplicates += 1;
			continue;
		}
		const key = tradeKey(t.date, t.quantity, t.price);
		const n = counts.get(key) ?? 0;
		if (n > 0) {
			counts.set(key, n - 1);
			duplicates += 1;
		} else {
			fresh.push(t);
		}
	}
	return { fresh, duplicates };
}

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

// Ledger order: date, then insertion order. New ObjectIds sort after stored
// ones, which is where the rows land once inserted.
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

function planStock({ stockName, trades, stored, importBatchId }) {
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

async function planImport(userId, content, { session = null, importBatchId } = {}) {
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

// ─── Commit ──────────────────────────────────────────────────────────────────

async function snapshot(stockId, session) {
	return {
		stock: await Stock.findById(stockId).session(session).lean(),
		lots: await History.find({ stockId }).session(session).lean(),
		events: await SellEvent.find({ stockId }).session(session).lean(),
	};
}

/**
 * A fingerprint of a stock's stored state. Undo compares it with the one taken
 * right after the import; any buy, sale or delete since then changes it.
 */
async function fingerprint(userId, entry, session) {
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

// Rows created by this import, as opposed to stored rows (which may carry an
// earlier import's id).
const fromBatch = (rows, importBatchId) => rows.filter((r) => String(r.importBatchId) === String(importBatchId));

async function insertLots(lots, { userId, stockId, session }) {
	const docs = lots.map((l) => ({ ...l, userId, stockId, quantitySold: 0 }));
	if (docs.length) await History.insertMany(docs, { session });
}

export async function commitImport(userId, { fileName, content, choices = {}, replaceAll = false, confirmReplaceAll }) {
	if (replaceAll && confirmReplaceAll !== "REPLACE") {
		throw new AppError('Type REPLACE to confirm replacing your whole portfolio.', 400);
	}

	const importBatchId = new ObjectId();
	const createdSymbols = [];

	let batch;
	try {
		batch = await withTransaction(async (session) => {
			createdSymbols.length = 0;
			const plan = await planImport(userId, content, { session, importBatchId });
			const entries = [];

			for (const s of plan.stocks) {
				let choice = replaceAll ? (s.exists ? "replace" : "merge") : (choices[s.stockName] ?? s.defaultChoice);
				if (!choice) {
					throw new AppError(`Choose what to do with ${s.stockName} before importing.`, 409);
				}
				if (s.status === "unchanged" && choice === "merge") choice = "keep";
				if (choice === "keep") continue;

				const option = s.options[choice];
				if (!option?.ok) {
					throw new AppError(
						`${s.stockName} can't be imported that way: ${option?.reason ?? "unknown option"}`,
						409,
					);
				}

				let stock = s.stock;
				let action;
				let before = null;
				if (!s.exists) {
					stock = new Stock({ userId, stockName: s.stockName, instrumentKey: s.instrumentKey, quantity: 0, avgPrice: 0 });
					action = "created";
					createdSymbols.push([s.stockName, s.instrumentKey]);
				} else {
					before = await snapshot(stock._id, session);
					if (choice === "replace") {
						await History.deleteMany({ stockId: stock._id }, { session });
						await SellEvent.deleteMany({ stockId: stock._id }, { session });
						action = "replaced";
					} else {
						action = "merged";
					}
					if (!stock.instrumentKey && s.instrumentKey) stock.instrumentKey = s.instrumentKey;
				}

				const newLots = fromBatch(option.lots, importBatchId);
				await insertLots(newLots, { userId, stockId: stock._id, session });
				await persistReplay({
					stock,
					userId,
					lots: option.lots,
					events: option.events,
					result: option.result,
					session,
				});

				entries.push({
					stockId: stock._id,
					stockName: s.stockName,
					action,
					before,
					lotsAdded: newLots.length,
					sellsAdded: fromBatch(option.events, importBatchId).length,
				});
			}

			if (replaceAll) {
				for (const u of plan.untouched) {
					const before = await snapshot(u.stock._id, session);
					await SellEvent.deleteMany({ stockId: u.stock._id }, { session });
					await History.deleteMany({ stockId: u.stock._id }, { session });
					await Stock.deleteOne({ _id: u.stock._id }, { session });
					entries.push({ stockId: u.stock._id, stockName: u.stockName, action: "deleted", before });
				}
			}

			if (!entries.length) return null;

			for (const entry of entries) entry.fingerprintAfter = await fingerprint(userId, entry, session);
			const doc = new ImportBatch({
				_id: importBatchId,
				userId,
				source: plan.source,
				fileName: fileName ?? "",
				fileHash: plan.fileHash,
				replaceAll,
				entries,
			});
			await doc.save({ session });
			return doc;
		});
	} catch (err) {
		if (err?.code === 11000) {
			throw new AppError("Your portfolio changed while importing. Review the preview again.", 409);
		}
		throw err;
	}

	for (const [symbol, key] of createdSymbols) subscriptionService.addSymbol(symbol, key);

	if (!batch) return { batch: null, message: "Nothing to import: everything in this file is already in your portfolio." };
	return { batch: describeBatch(batch.toObject()) };
}

// ─── History & undo ──────────────────────────────────────────────────────────

function describeBatch(b) {
	const count = (action) => b.entries.filter((e) => e.action === action).length;
	const undoExpiresAt = new Date(new Date(b.createdAt).getTime() + UNDO_WINDOW_MS);
	return {
		id: String(b._id),
		fileName: b.fileName,
		source: b.source,
		status: b.status,
		createdAt: b.createdAt,
		undoneAt: b.undoneAt ?? null,
		replaceAll: b.replaceAll,
		stocks: {
			created: count("created"),
			merged: count("merged"),
			replaced: count("replaced"),
			deleted: count("deleted"),
		},
		lotsAdded: b.entries.reduce((n, e) => n + (e.lotsAdded ?? 0), 0),
		sellsAdded: b.entries.reduce((n, e) => n + (e.sellsAdded ?? 0), 0),
		undoExpiresAt,
		canUndo: b.status === "COMMITTED" && Date.now() < undoExpiresAt.getTime(),
	};
}

export async function listImports(userId) {
	const batches = await ImportBatch.find({ userId })
		.sort({ createdAt: -1 })
		.limit(10)
		.select("-entries.before")
		.lean();
	return batches.map(describeBatch);
}

/**
 * Puts every stock the import touched back the way it was. Refused if any of
 * them changed after the import (a later buy, sale, delete or import), since
 * restoring would silently throw that change away.
 */
export async function undoImport(userId, batchId) {
	if (!ObjectId.isValid(batchId)) throw new AppError("Import not found", 404);
	const found = await ImportBatch.findOne({ _id: batchId, userId }).select("status createdAt").lean();
	if (!found) throw new AppError("Import not found", 404);
	if (found.status === "UNDONE") throw new AppError("This import was already undone.", 409);
	if (Date.now() - new Date(found.createdAt).getTime() > UNDO_WINDOW_MS) {
		throw new AppError(`Imports can only be undone within ${UNDO_WINDOW_DAYS} days.`, 409);
	}

	const batch = await withTransaction(async (session) => {
		const doc = await ImportBatch.findOne({ _id: batchId, userId, status: "COMMITTED" }).session(session);
		if (!doc) throw new AppError("This import was already undone.", 409);

		const changed = [];
		for (const entry of doc.entries) {
			if ((await fingerprint(userId, entry, session)) !== entry.fingerprintAfter) changed.push(entry.stockName);
		}
		if (changed.length) {
			throw new AppError(
				`Can't undo: ${changed.join(", ")} changed after this import. Undoing would lose those changes.`,
				409,
			);
		}

		for (const entry of doc.entries) {
			await SellEvent.deleteMany({ stockId: entry.stockId }, { session });
			await History.deleteMany({ stockId: entry.stockId }, { session });
			await Stock.deleteOne({ _id: entry.stockId }, { session });
			const before = entry.before;
			if (!before?.stock) continue;
			await Stock.collection.insertOne(before.stock, { session });
			if (before.lots?.length) await History.collection.insertMany(before.lots, { session });
			if (before.events?.length) await SellEvent.collection.insertMany(before.events, { session });
		}

		doc.status = "UNDONE";
		doc.undoneAt = new Date();
		await doc.save({ session });
		return doc;
	});

	for (const entry of batch.entries) {
		if (entry.before?.stock) subscriptionService.addSymbol(entry.stockName, entry.before.stock.instrumentKey);
	}
	return { batch: describeBatch(batch.toObject()) };
}
