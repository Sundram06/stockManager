import { User } from "../models/index.mjs";
import { signAuthToken, verifyAuthToken } from "../utils/jwt.mjs";

export const issueAuthToken = (user) =>
	signAuthToken({ userId: user._id, tokenVersion: user.tokenVersion ?? 0 });

/**
 * Resolves a session token to its user id. Returns null when the token is
 * malformed, expired, signed differently, or revoked by a later logout or
 * password reset. Tokens issued before tokenVersion existed carry no `ver`
 * and stay valid until the user's first revocation.
 */
export const resolveAuthToken = async (token) => {
	let payload;
	try {
		payload = verifyAuthToken(token);
	} catch {
		return null;
	}

	const user = await User.findById(payload.userId).select("tokenVersion").lean().catch(() => null);
	if (!user || (user.tokenVersion ?? 0) !== (payload.ver ?? 0)) return null;
	return String(user._id);
};

/** Invalidates every token issued to the user so far. */
export const revokeAuthTokens = (userId) => User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
