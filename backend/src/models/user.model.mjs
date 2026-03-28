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
});

userSchema.pre("save", async function userPreSave(next) {
	if (this.isModified("password") && this.password) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
