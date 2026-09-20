import { clearTokenExpiryTimer } from "./session.mjs";
import { apiJson } from "./request.mjs";

// Registering and signing in happen before there is a token, hence auth: false.
export const addUser = (registerData) =>
	apiJson("/register", { method: "POST", body: registerData, auth: false, fallback: "Unable to register user" });

export const loginUser = (loginData) =>
	apiJson("/login", { method: "POST", body: loginData, auth: false, fallback: "Unable to login" });

export async function logoutUser() {
	localStorage.removeItem("token");
	clearTokenExpiryTimer();
}
