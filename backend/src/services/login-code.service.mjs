import { LoginCode } from "../models/index.mjs";
import { randomToken, sha256 } from "../utils/crypto.mjs";

const LOGIN_CODE_TTL_MS = 60 * 1000;

/** Creates a single-use code for the user, valid for one minute. Returns the raw code. */
export const createLoginCode = async (userId) => {
	const code = randomToken();
	await LoginCode.create({
		codeHash: sha256(code),
		userId,
		expiresAt: new Date(Date.now() + LOGIN_CODE_TTL_MS),
	});
	return code;
};

/** Consumes a code and returns its user id, or null if it is unknown, used or expired. */
export const redeemLoginCode = async (code) => {
	const doc = await LoginCode.findOneAndDelete({
		codeHash: sha256(code),
		expiresAt: { $gt: new Date() },
	});
	return doc ? doc.userId : null;
};
