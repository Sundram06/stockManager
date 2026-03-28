import mongoose from "mongoose";

const Schema = mongoose.Schema;

const stockSchema = new Schema({
	id: Schema.ObjectId,
	stockName: String,
	quantity: Number,
	avgPrice: Number,
	totalCostOfStock: Number,
	ltp: Number,
	currVal: Number,
	pnl: Number,
	netChange: Number,
	dayChange: Number,
	userId: { type: Schema.Types.ObjectId, ref: "User" },
});

export const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);
