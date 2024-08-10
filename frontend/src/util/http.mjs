import { jwtDecode } from "jwt-decode";
import { logout } from "../store/auth-slice";
import store from "../store/store.js";
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

export async function createStock(stockData) {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	console.log(stockData);
	const response = await fetch("http://localhost:3000/stocks", {
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
		console.log("no token found");
		store.dispatch(logout({ message: "Session expired. Please login again." }));
		return false;
	}
	const { exp } = jwtDecode(token);
	const currentTime = Math.floor(Date.now() / 1000);
	const timeUntillExpiry = exp - currentTime;
	if (timeUntillExpiry <= 0) {
		localStorage.removeItem("token");
		store.dispatch(logout({ message: "Session expired. Please login again." }));
	} else {
		setTimeout(() => {
			localStorage.removeItem("token");
			store.dispatch(
				logout({ message: "Session expired. Please login again." })
			);
		}, timeUntillExpiry * 1000);
	}
};

// const handleTokenExpiry = async (response) => {
// 	if (response.status === 401 || response.status === 403) {
// 		localStorage.removeItem("token");
// 		store.dispatch(logout({ message: "Session expired. Please login again." }));
// 		throw new Error("Unauthorized");
// 	}
// };

export const fetchStocks = async () => {
	const token = localStorage.getItem("token");
	const tokenCheck = checkTokenExpiry(token);
	if (tokenCheck === false) return tokenCheck;
	console.log(token);
	const response = await fetch("http://localhost:3000/stocks", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	// await handleTokenExpiry(response);
	const data = await response.json();
	console.log("get query of stocks", data);
	return data;
};

export const fetchStockHistoryById = async () => {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	const response = await fetch(`http://localhost:3000/history/`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	// await handleTokenExpiry(response);
	const data = await response.json();
	console.log("get history of stock id ", data);
	return data;
};

export async function deleteAllStocks() {
	const response = await fetch("http://localhost:3000/stocks", {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Failed to delete all stocks and history");
	}
}

export async function handleAddStockRowInHistory(stockData) {
	const token = localStorage.getItem("token");
	checkTokenExpiry(token);
	console.log("data in handleAddStockRowInHistory", stockData);
	const response = await fetch("http://localhost:3000/history", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	// await handleTokenExpiry(response);
	if (!response.ok) {
		throw new Error("Unable to create stock");
	}
	const data = await response.json();
	return data;
}

export async function addUser(registerData) {
	console.log("inside addUser", registerData);
	const response = await fetch("http://localhost:3000/register", {
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
	console.log("inside loginUser", loginData);

	const response = await fetch("http://localhost:3000/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(loginData),
	});
	if (!response.ok) {
		const error = await response.json();
		console.log("Login error : ", error.message);
		throw new Error("Unable to login ", error.message);
	}
	const data = await response.json();
	return data;
}
export async function logoutUser() {
	console.log("Logging out user");
	localStorage.removeItem("token");
}
