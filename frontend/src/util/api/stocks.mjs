import { apiJson } from "./request.mjs";

export const createStock = (stockData) =>
	apiJson("/stocks", { method: "POST", body: stockData, fallback: "Unable to create stock" });

export const fetchStocks = () => apiJson("/stocks", { fallback: "Unable to fetch stocks" });

export const deleteStock = (stockId) =>
	apiJson(`/stocks/${stockId}`, { method: "DELETE", fallback: "Failed to delete stock" });

export const deleteAllStocks = () =>
	apiJson("/stocks", { method: "DELETE", fallback: "Failed to delete all stocks and history" });

export const fetchUpstoxData = () =>
	apiJson("/api/upstox/login", { fallback: "Unable to fetch upstox data" });
