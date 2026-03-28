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
	dateSold: Date,
	quantitySold: Number,
	sellingPrice: Number,
	pnl: Number,
});

export const History =
	mongoose.models.History || mongoose.model("History", historySchema);
