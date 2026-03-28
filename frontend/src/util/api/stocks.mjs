import { API_URL } from "./config.mjs";
import { getValidTokenOrThrow } from "./session.mjs";

const parseJsonOrThrow = async (response, fallbackMessage) => {
	if (!response.ok) {
		let message = fallbackMessage;
		try {
			const errorData = await response.json();
			if (errorData?.message) {
				message = errorData.message;
			}
		} catch {
			// Keep fallback message when response body is not JSON.
		}
		throw new Error(message);
	}
	return response.json();
};

export async function createStock(stockData) {
	const token = getValidTokenOrThrow();
	const response = await fetch(`${API_URL}/stocks`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	return parseJsonOrThrow(response, "Unable to create stock");
}

export async function fetchStocks() {
	const token = getValidTokenOrThrow();
	const response = await fetch(`${API_URL}/stocks`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return parseJsonOrThrow(response, "Unable to fetch stocks");
}

export async function deleteAllStocks() {
	const response = await fetch(`${API_URL}/stocks`, {
		method: "DELETE",
	});
	if (!response.ok) {
		throw new Error("Failed to delete all stocks and history");
	}
}

export async function fetchUpstoxData() {
	const response = await fetch(`${API_URL}/api/upstox/login`);
	return parseJsonOrThrow(response, "Unable to fetch upstox data");
}
