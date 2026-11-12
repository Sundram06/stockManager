import mongoose from "mongoose";

const Schema = mongoose.Schema;

// A one-time code handed to the browser after Google sign-in, exchanged once
// for a session token. Only the hash is stored.
const loginCodeSchema = new Schema({
	codeHash: { type: String, required: true, unique: true },
	userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
	// MongoDB removes expired codes on its own; redemption also checks the time
	// because that cleanup runs about once a minute.
	expiresAt: { type: Date, required: true, index: { expires: 0 } },
});

export const LoginCode = mongoose.models.LoginCode || mongoose.model("LoginCode", loginCodeSchema);
