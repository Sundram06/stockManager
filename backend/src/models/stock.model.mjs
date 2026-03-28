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

export const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
