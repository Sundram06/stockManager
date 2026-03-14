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

export async function fetchStockHistoryById() {
	const token = getValidTokenOrThrow();
	const response = await fetch(`${API_URL}/history/`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return parseJsonOrThrow(response, "Unable to fetch stock history");
}

export async function handleAddStockRowInHistory(stockData) {
	const token = getValidTokenOrThrow();
	const response = await fetch(`${API_URL}/history`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	return parseJsonOrThrow(response, "Unable to create stock history row");
}

export async function handleSellStockRowInHistory(stockData) {
	const token = getValidTokenOrThrow();
	const response = await fetch(`${API_URL}/history/sell`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(stockData),
	});
	return parseJsonOrThrow(response, "Unable to sell stock");
}
