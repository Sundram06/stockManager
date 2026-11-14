import crypto from "node:crypto";

/** A random hex string, safe to put in a URL. 32 bytes unless stated otherwise. */
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

/** Tokens are stored as this hash, so a database leak does not expose working links. */
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

/** Constant-time string comparison; false when lengths differ. */
export const safeEqual = (a, b) => {
	const left = Buffer.from(String(a));
	const right = Buffer.from(String(b));
	return left.length === right.length && crypto.timingSafeEqual(left, right);
};
