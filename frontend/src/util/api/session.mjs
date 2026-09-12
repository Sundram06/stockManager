import { jwtDecode } from "jwt-decode";
import { logout } from "../../store/auth-slice";
import store from "../../store/store.js";

let tokenExpiryTimerId = null;
let scheduledToken = null;

/**
 * Tears the session down: clears the stored token and puts Redux into the
 * expired state, which routes the user back to /login.
 *
 * This is a deliberate side effect — only call it when the session is
 * genuinely over, never as part of a "do we have a token?" check.
 */
export const expireSession = (reason = "expired") => {
	localStorage.removeItem("token");
	sessionStorage.setItem("sessionExpired", "1");
	store.dispatch(
		logout({
			message:
				reason === "invalid"
					? "Invalid session. Please login again."
					: "Session expired. Please login again.",
			sessionActive: "expired",
		}),
	);
};

export const clearTokenExpiryTimer = () => {
	if (tokenExpiryTimerId) {
		clearTimeout(tokenExpiryTimerId);
		tokenExpiryTimerId = null;
	}
	scheduledToken = null;
};

/**
 * Pure predicate. Returns "missing" | "expired" | "invalid" | "valid".
 * Dispatches nothing and touches no storage, so it is safe to call on every
 * request. Callers decide whether a given status ends the session.
 */
export const getTokenStatus = (token) => {
	if (!token) return "missing";
	try {
		const { exp } = jwtDecode(token);
		return exp - Math.floor(Date.now() / 1000) <= 0 ? "expired" : "valid";
	} catch {
		return "invalid";
	}
};

export const isTokenValid = (token) => getTokenStatus(token) === "valid";

export const scheduleTokenExpiryTimer = (token) => {
	if (!isTokenValid(token)) {
		clearTokenExpiryTimer();
		return false;
	}

	if (scheduledToken === token && tokenExpiryTimerId) {
		return true;
	}

	const { exp } = jwtDecode(token);
	const timeUntillExpiry = exp - Math.floor(Date.now() / 1000);

	clearTokenExpiryTimer();
	scheduledToken = token;
	tokenExpiryTimerId = setTimeout(
		() => {
			expireSession();
			clearTokenExpiryTimer();
		},
		Math.max(0, timeUntillExpiry * 1000),
	);

	return true;
};

export const getValidTokenOrThrow = () => {
	const token = localStorage.getItem("token");
	const status = getTokenStatus(token);

	if (status === "valid") return token;

	// A token that is present but expired or unparseable means the session is
	// genuinely over, so tear it down. A *missing* token does not: this helper
	// runs on every API call, and a request that races a sign-in or a storage
	// read that comes back empty must not log the user out. Throw and let the
	// caller surface the failure; the route guards handle the redirect.
	if (status !== "missing") expireSession(status);

	throw new Error("Session expired. Please login again.");
};
