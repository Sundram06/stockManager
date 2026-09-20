import mongoose from "mongoose";
import bcrypt from "bcrypt";

const Schema = mongoose.Schema;

const userSchema = new Schema({
	id: Schema.ObjectId,
	name: String,
	email: { type: String, required: true, unique: true },
	password: String,
	googleId: String,
	provider: { type: String, default: "local" },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isEmailVerified: { type: Boolean },  // undefined = existing user (treated as verified), false = new unverified
	emailVerificationToken: String,
	emailVerificationExpires: Date,
});

userSchema.pre("save", async function userPreSave(next) {
	if (this.isModified("password") && this.password) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

// ── Cascade: deleting a user deletes everything they own ──────────────────────
// Runs for every Mongoose delete path (deleteOne, deleteMany, findOneAndDelete,
// findByIdAndDelete, doc.deleteOne) and joins the caller's session, so inside
// a transaction the user and their data disappear together or not at all.
// Deletions made outside Mongoose (e.g. by hand in the Atlas UI) bypass this;
// `npm run cleanup:orphans` is the backstop for those.
async function deleteDataOwnedBy(userIds, session) {
	if (!userIds.length) return;
	// Resolved at call time to avoid a circular import between model files.
	const Stock = mongoose.model("Stock");
	const History = mongoose.model("History");
	const SellEvent = mongoose.model("SellEvent");

	const stockIds = (await Stock.find({ userId: { $in: userIds } }, { _id: 1 }).session(session)).map(
		(s) => s._id,
	);
	const owned = { $or: [{ userId: { $in: userIds } }, { stockId: { $in: stockIds } }] };
	await SellEvent.deleteMany(owned, { session });
	await History.deleteMany(owned, { session });
	await Stock.deleteMany({ userId: { $in: userIds } }, { session });
	if (mongoose.modelNames().includes("ImportBatch")) {
		await mongoose.model("ImportBatch").deleteMany({ userId: { $in: userIds } }, { session });
	}
}

userSchema.pre(
	["deleteOne", "deleteMany", "findOneAndDelete"],
	{ query: true, document: false },
	async function cascadeQueryDelete() {
		const session = this.getOptions().session ?? null;
		const users = await this.model.find(this.getFilter(), { _id: 1 }).session(session);
		await deleteDataOwnedBy(
			users.map((u) => u._id),
			session,
		);
	},
);

userSchema.pre("deleteOne", { document: true, query: false }, async function cascadeDocDelete() {
	await deleteDataOwnedBy([this._id], this.$session());
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
