import { clearTokenExpiryTimer, isTokenValid } from "./session.mjs";
import { apiFetch, apiJson } from "./request.mjs";

// Registering and signing in happen before there is a token, hence auth: false.
export const addUser = (registerData) =>
	apiJson("/register", { method: "POST", body: registerData, auth: false, fallback: "Unable to register user" });

export const loginUser = (loginData) =>
	apiJson("/login", { method: "POST", body: loginData, auth: false, fallback: "Unable to login" });

/** Trades the one-time code from the Google redirect for `{ user, token }`. */
export const exchangeGoogleCode = (code) =>
	apiJson("/api/auth/google/exchange", {
		method: "POST",
		body: { code },
		auth: false,
		fallback: "Google sign-in failed",
	});

export async function logoutUser() {
	// Revokes the token on the server too, so a copy of it stops working. Signing
	// out locally must not depend on that request succeeding.
	if (isTokenValid(localStorage.getItem("token"))) {
		try {
			await apiFetch("/logout", { method: "POST" });
		} catch {
			// Server unreachable: the token still expires on its own.
		}
	}
	localStorage.removeItem("token");
	clearTokenExpiryTimer();
}
