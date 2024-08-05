import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const historySchema = new Schema({
	id: Schema.ObjectId,
	quantity: Number,
	avgPrice: Number,
	age: Number,
	stockId: { type: Schema.Types.ObjectId, ref: "Stock" },
	date: { type: Date, default: Date.now },
});

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

const userSchema = new Schema({
	id: Schema.ObjectId,
	name: String,
	email: { type: String, required: true, unique: true },
	password: String,
});

userSchema.pre("save", function (next) {
	if (this.isModified("password") || this.isNew) {
		this.password = bcrypt.hash(this.password, 10);
	}
	next();
});

export const Stock = mongoose.model("Stock", stockSchema);
export const History = mongoose.model("History", historySchema);
export const User = mongoose.model("User", userSchema);
