import mongoose from "mongoose";
import { AppError } from "../../errors/app-error.mjs";
import { History, ImportBatch, SellEvent, Stock } from "../../models/index.mjs";
import { withTransaction } from "../ledger.service.mjs";
import { subscriptionService } from "../subscription.service.mjs";
import { fingerprint } from "./state.mjs";

// Past imports, and undoing one.

export const UNDO_WINDOW_DAYS = 7;
const UNDO_WINDOW_MS = UNDO_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const { ObjectId } = mongoose.Types;

/** An ImportBatch as the client sees it: counts, not snapshots. */
export function describeBatch(b) {
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

		// Raw inserts, so restored documents keep their original _ids.
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
