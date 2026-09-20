import mongoose from "mongoose";

const Schema = mongoose.Schema;

const stockSchema = new Schema({
	id: Schema.ObjectId,
	stockName: String,
	instrumentKey: { type: String }, // e.g. "NSE_EQ|INE009A01021" — populated from Phase 1 instrument search
	quantity: Number,
	avgPrice: Number,
	totalCostOfStock: Number,
	userId: { type: Schema.Types.ObjectId, ref: "User" },
});

// One Stock document per user per symbol. Without this, two near-simultaneous
// "add stock" requests (or an import) could create a second RELIANCE for the
// same user, splitting its lots across two ledgers. Existing duplicates must be
// merged first (npm run merge:duplicate-stocks) or the index build fails.
stockSchema.index({ userId: 1, stockName: 1 }, { unique: true });

export const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
