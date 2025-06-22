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
	dateSold: Date,
	quantitySold: Number,
	sellingPrice: Number,
	pnl: Number,
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
	password: String, // Not required for Google login
	googleId: String, // <-- NEW: Store Google account id
	provider: { type: String, default: "local" }, // local or google
});

// Only hash password if present and changed
userSchema.pre("save", async function (next) {
	if (this.isModified("password") && this.password) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

export const Stock = mongoose.model("Stock", stockSchema);
export const History = mongoose.model("History", historySchema);
export const User = mongoose.model("User", userSchema);
