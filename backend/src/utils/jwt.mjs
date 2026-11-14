import jwt from "jsonwebtoken";
import { AUTH_TOKEN_EXPIRY } from "../config/constants.mjs";
import { env } from "../config/env.mjs";

// Pinned so a token signed with any other algorithm is rejected outright.
const ALGORITHM = "HS256";

/** Signs a session token. `ver` must match the user's tokenVersion for the token to stay valid. */
export const signAuthToken = ({ userId, tokenVersion = 0 }) =>
	jwt.sign({ userId: String(userId), ver: tokenVersion }, env.JWT_SECRET, {
		algorithm: ALGORITHM,
		expiresIn: AUTH_TOKEN_EXPIRY,
	});

/** Returns the token's payload, or throws when it is malformed, expired or signed differently. */
export const verifyAuthToken = (token) => jwt.verify(token, env.JWT_SECRET, { algorithms: [ALGORITHM] });
