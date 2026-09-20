import { API_URL } from "./config.mjs";
import { getValidTokenOrThrow } from "./session.mjs";

/**
 * Fetch daily close-price history for a stock.
 *
 * @param {string} instrument  instrument key ("NSE_EQ|INE009A01021") or, for
 *                             stocks added before Phase 1, the bare trading symbol.
 * @param {"1W"|"1M"|"3M"|"6M"|"1Y"|"ALL"} [range="ALL"]
 * @returns {Promise<{ instrumentKey: string, range: string, candles: Array<{date: string, price: number}> }>}
 */
export async function fetchPriceHistory(instrument, range = "ALL") {
	const token = getValidTokenOrThrow();
	const url = `${API_URL}/api/market/history/${encodeURIComponent(instrument)}?range=${range}`;
	const response = await fetch(url, {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!response.ok) {
		let message = "Unable to load price history";
		try {
			const body = await response.json();
			if (body?.message) message = body.message;
		} catch {
			// non-JSON error body
		}
		throw new Error(message);
	}
	return response.json();
}
