import mongoose from "mongoose";

const Schema = mongoose.Schema;

const historySchema = new Schema({
	id: Schema.ObjectId,
	quantity: Number,
	avgPrice: Number,
	age: Number,
	stockId: { type: Schema.Types.ObjectId, ref: "Stock" },
	userId: { type: Schema.Types.ObjectId, ref: "User" },
	date: { type: Date, default: Date.now },
	// Sell caches. Rebuilt from SellEvent by every ledger replay; never edit
	// them directly. Kept so the frontend and list endpoints read them unchanged.
	dateSold: Date,
	quantitySold: Number,
	sellingPrice: Number,
	pnl: Number,
	// Provenance, for import dedupe and undo. All optional; manual rows omit them.
	source: { type: String, default: "MANUAL" },
	externalTradeId: String,
	externalOrderId: String,
	importBatchId: Schema.Types.ObjectId,
	isEstimatedDate: { type: Boolean, default: false },
	isin: String,
	exchange: String,
});

historySchema.index({ stockId: 1, date: 1, _id: 1 });
historySchema.index(
	{ userId: 1, externalTradeId: 1 },
	{ unique: true, partialFilterExpression: { externalTradeId: { $type: "string" } } },
);

export const History =
	mongoose.models.History || mongoose.model("History", historySchema);
