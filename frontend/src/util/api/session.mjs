import { jwtDecode } from "jwt-decode";
import { logout } from "../../store/auth-slice";
import store from "../../store/store.js";

let tokenExpiryTimerId = null;
let scheduledToken = null;

const expireSession = () => {
	localStorage.removeItem("token");
	sessionStorage.setItem("sessionExpired", "1");
	store.dispatch(
		logout({
			message: "Session expired. Please login again.",
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

export const checkTokenExpiry = (token) => {
	if (!token) {
		store.dispatch(
			logout({
				message: "Session expired. Please login again.",
				sessionActive: "notLoggedIn",
			}),
		);
		return false;
	}

	try {
		const { exp } = jwtDecode(token);
		const currentTime = Math.floor(Date.now() / 1000);
		const timeUntillExpiry = exp - currentTime;

		if (timeUntillExpiry <= 0) {
			expireSession();
			return false;
		}

		return true;
	} catch {
		localStorage.removeItem("token");
		store.dispatch(
			logout({
				message: "Invalid session. Please login again.",
				sessionActive: "expired",
			}),
		);
		return false;
	}
};

export const scheduleTokenExpiryTimer = (token) => {
	if (!token) {
		clearTokenExpiryTimer();
		return false;
	}

	if (scheduledToken === token && tokenExpiryTimerId) {
		return true;
	}

	if (!checkTokenExpiry(token)) {
		clearTokenExpiryTimer();
		return false;
	}

	const { exp } = jwtDecode(token);
	const currentTime = Math.floor(Date.now() / 1000);
	const timeUntillExpiry = exp - currentTime;

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
	if (!checkTokenExpiry(token)) {
		throw new Error("Session expired. Please login again.");
	}
	return token;
};
