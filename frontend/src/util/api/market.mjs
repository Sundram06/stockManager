import { apiJson } from "./request.mjs";

/**
 * Fetch daily close-price history for a stock.
 *
 * @param {string} instrument  instrument key ("NSE_EQ|INE009A01021") or, for
 *                             stocks added before Phase 1, the bare trading symbol.
 * @param {"1W"|"1M"|"3M"|"6M"|"1Y"|"ALL"} [range="ALL"]
 * @returns {Promise<{ instrumentKey: string, range: string, candles: Array<{date: string, price: number}> }>}
 */
export const fetchPriceHistory = (instrument, range = "ALL") =>
	apiJson(`/api/market/history/${encodeURIComponent(instrument)}?range=${range}`, {
		fallback: "Unable to load price history",
	});
