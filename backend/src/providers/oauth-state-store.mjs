import { randomToken, safeEqual } from "../utils/crypto.mjs";

const COOKIE_NAME = "vittnest_oauth_state";
const COOKIE_PATH = "/api/auth/google";
const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * OAuth `state` kept in a short-lived cookie instead of a server session.
 * The callback only succeeds in the browser that started the sign-in, so a
 * callback link made from someone else's Google account cannot log a victim
 * into that account. SameSite=Lax still sends the cookie on Google's
 * top-level redirect back to the callback. Requires cookie-parser on the
 * callback route.
 *
 * The method arities are what passport-oauth2 dispatches on: store(req, meta, cb)
 * and verify(req, state, cb).
 */
export const createCookieStateStore = ({ secure }) => {
	const cookieOptions = { httpOnly: true, secure, sameSite: "lax", path: COOKIE_PATH };

	return {
		store(req, meta, callback) {
			const state = randomToken(24);
			req.res.cookie(COOKIE_NAME, state, { ...cookieOptions, maxAge: STATE_TTL_MS });
			callback(null, state);
		},

		verify(req, state, callback) {
			const expected = req.cookies?.[COOKIE_NAME];
			req.res.clearCookie(COOKIE_NAME, cookieOptions);
			if (!expected || !state || !safeEqual(expected, state)) {
				return callback(null, false, { message: "Sign-in could not be verified. Try again." });
			}
			return callback(null, true);
		},
	};
};
