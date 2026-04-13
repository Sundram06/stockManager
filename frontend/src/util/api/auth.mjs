import { API_URL } from "./config.mjs";
import { clearTokenExpiryTimer } from "./session.mjs";

const parseJsonOrThrow = async (response, fallbackMessage) => {
	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		const err = new Error(data?.message || fallbackMessage);
		err.code = data?.code;
		throw err;
	}
	return data;
};

export async function addUser(registerData) {
	const response = await fetch(`${API_URL}/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(registerData),
	});
	return parseJsonOrThrow(response, "Unable to register user");
}

export async function loginUser(loginData) {
	const response = await fetch(`${API_URL}/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(loginData),
	});
	return parseJsonOrThrow(response, "Unable to login");
}

export async function logoutUser() {
	localStorage.removeItem("token");
	clearTokenExpiryTimer();
}
