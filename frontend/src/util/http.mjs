import { jwtDecode } from "jwt-decode";
import { logout } from "../store/auth-slice";
import store from "../store/store.js";
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

// Get API base URL from env (Vite will replace this at build time)
export const API_URL = import.meta.env.VITE_API_URL;

export async function createStock(stockData) {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	console.log("http mjs createStock function");
	const response = await fetch(`${API_URL}/stocks`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	if (!response.ok) {
		throw new Error("Unable to create stock");
	}
	const data = await response.json();
	return data;
}

export const checkTokenExpiry = (token) => {
	if (!token) {
		store.dispatch(
			logout({
				message: "Session expired. Please login again.",
				sessionActive: "notLoggedIn",
			})
		);
		return false;
	}
	const { exp } = jwtDecode(token);
	const currentTime = Math.floor(Date.now() / 1000);
	const timeUntillExpiry = exp - currentTime;
	if (timeUntillExpiry <= 0) {
		localStorage.removeItem("token");
		sessionStorage.setItem("sessionExpired", "1");
		store.dispatch(
			logout({
				message: "Session expired. Please login again.",
				sessionActive: "expired",
			})
		);
	} else {
		setTimeout(() => {
			localStorage.removeItem("token");
			sessionStorage.setItem("sessionExpired", "1");
			store.dispatch(
				logout({
					message: "Session expired. Please login again.",
					sessionActive: "expired",
				})
			);
		}, timeUntillExpiry * 1000);
	}
};

export const fetchUpstoxData = async () => {
	const response = await fetch(`${API_URL}/api/upstox/login`);
	if (!response.ok) {
		throw new Error("Unable to fetch upstox data");
	}
	const data = await response.json();
	return data;
};

export const fetchStocks = async () => {
	const token = localStorage.getItem("token");
	const tokenCheck = checkTokenExpiry(token);
	if (tokenCheck === false) return tokenCheck;
	const response = await fetch(`${API_URL}/stocks`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const data = await response.json();
	return data;
};

export const fetchStockHistoryById = async () => {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	const response = await fetch(`${API_URL}/history/`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	const data = await response.json();
	return data;
};

export async function deleteAllStocks() {
	const response = await fetch(`${API_URL}/stocks`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Failed to delete all stocks and history");
	}
}

export async function handleAddStockRowInHistory(stockData) {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	const response = await fetch(`${API_URL}/history`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	if (!response.ok) {
		throw new Error("Unable to create stock");
	}
	const data = await response.json();
	return data;
}

export async function addUser(registerData) {
	const response = await fetch(`${API_URL}/register`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${"token"}`,
		},
		body: JSON.stringify(registerData),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error("Unable to register user : ", errorData.message);
	}
	const data = await response.json();
	return data;
}

export async function loginUser(loginData) {
	const response = await fetch(`${API_URL}/login`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(loginData),
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error("Unable to login ", error.message);
	}
	const data = await response.json();
	console.log("loginUser", data);
	return data;
}

export async function handleSellStockRowInHistory(stockData) {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	const response = await fetch(`${API_URL}/history/sell`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	if (!response.ok) {
		throw new Error("Unable to sell stock");
	}
	const data = await response.json();
	return data;
}

export async function logoutUser() {
	localStorage.removeItem("token");
}
