import mongoose from "mongoose";
import { AppError } from "../../errors/app-error.mjs";
import { History, ImportBatch, SellEvent, Stock } from "../../models/index.mjs";
import { persistReplay, withTransaction } from "../ledger.service.mjs";
import { subscriptionService } from "../subscription.service.mjs";
import { planImport } from "./plan.service.mjs";
import { fingerprint, snapshot } from "./state.mjs";
import { describeBatch } from "./batches.service.mjs";

// Writes an import. The plan is rebuilt inside the transaction so it acts on
// current data, and any stock whose chosen option no longer replays is refused
// rather than written differently from what the preview showed.

const { ObjectId } = mongoose.Types;

// Rows created by this import, as opposed to stored rows (which may carry an
// earlier import's id).
const fromBatch = (rows, importBatchId) => rows.filter((r) => String(r.importBatchId) === String(importBatchId));

async function insertLots(lots, { userId, stockId, session }) {
	const docs = lots.map((l) => ({ ...l, userId, stockId, quantitySold: 0 }));
	if (docs.length) await History.insertMany(docs, { session });
}

export async function commitImport(userId, { fileName, content, choices = {}, replaceAll = false, confirmReplaceAll }) {
	if (replaceAll && confirmReplaceAll !== "REPLACE") {
		throw new AppError("Type REPLACE to confirm replacing your whole portfolio.", 400);
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

			// Replace-all also means the stocks the file doesn't mention go.
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
