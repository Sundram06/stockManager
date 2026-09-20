import { apiJson } from "./request.mjs";

export const fetchStockHistoryById = () =>
	apiJson("/history/", { fallback: "Unable to fetch stock history" });

export const handleAddStockRowInHistory = (stockData) =>
	apiJson("/history", { method: "POST", body: stockData, fallback: "Unable to create stock history row" });

export const handleSellStockRowInHistory = (stockData) =>
	apiJson("/history/sell", { method: "POST", body: stockData, fallback: "Unable to sell stock" });
