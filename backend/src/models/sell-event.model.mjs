import mongoose from "mongoose";

const Schema = mongoose.Schema;

// One document per sale. The allocations record which buy lots the sale
// consumed under FIFO; they are rewritten by every ledger replay, so they are
// a cache of replayLedger() output, not user input. date/quantity/price are the
// user's (or broker's) facts and are never changed by a replay.
const allocationSchema = new Schema(
	{
		historyId: { type: Schema.Types.ObjectId, ref: "History", required: true },
		quantity: { type: Number, required: true },
		buyPrice: { type: Number, required: true },
		pnl: { type: Number, required: true },
	},
	{ _id: false },
);

const sellEventSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		stockId: { type: Schema.Types.ObjectId, ref: "Stock", required: true },
		date: { type: Date, required: true },
		quantity: { type: Number, required: true, min: 1 },
		price: { type: Number, required: true, min: 0 },
		// MANUAL: entered in the app. MIGRATED_DERIVED: reconstructed from the
		// pre-ledger History shape, so it may merge sells that were separate.
		source: { type: String, default: "MANUAL" },
		externalTradeId: { type: String },
		importBatchId: { type: Schema.Types.ObjectId },
		allocations: { type: [allocationSchema], default: [] },
		pnl: { type: Number, default: 0 },
	},
	{ timestamps: true },
);

sellEventSchema.index({ stockId: 1, date: 1, _id: 1 });
sellEventSchema.index(
	{ userId: 1, externalTradeId: 1 },
	{ unique: true, partialFilterExpression: { externalTradeId: { $type: "string" } } },
);

export const SellEvent =
	mongoose.models.SellEvent || mongoose.model("SellEvent", sellEventSchema);
