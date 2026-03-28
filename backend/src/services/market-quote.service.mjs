import fetch from "node-fetch";
import { getAnalyticsToken } from "../providers/analytics-token.provider.mjs";
import { marketCache } from "./market-cache.service.mjs";
import { logInfo, logError } from "../utils/logger.mjs";

const LTP_URL = "https://api.upstox.com/v3/market-quote/ltp";

/**
 * Fetches last traded price for all given instrument keys via REST and
 * populates the market cache. Called on startup and when new stocks are added
 * so the dashboard always shows a price even when the market is closed.
 */
export const fetchAndCacheLTP = async (instrumentKeys) => {
	if (!instrumentKeys || instrumentKeys.length === 0) return;

	try {
		const token = getAnalyticsToken();
		// Upstox accepts comma-separated instrument_key values
		const url = `${LTP_URL}?instrument_key=${instrumentKeys.join(",")}`;

		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});

		if (!res.ok) {
			logError("LTP REST fetch failed", { status: res.status, statusText: res.statusText });
			return;
		}

		const json = await res.json();
		if (json.status !== "success" || !json.data) {
			logError("LTP REST unexpected response", { body: JSON.stringify(json).slice(0, 200) });
			return;
		}

		const entries = Object.entries(json.data);
		let count = 0;
		for (const [, quote] of entries) {
			const key = quote.instrument_token; // e.g. "NSE_EQ|INE766P01016" — matches our cache format
			const ltp = quote.last_price;
			if (key && ltp != null) {
				marketCache.updateLTP(key, { ltp, cp: quote.cp ?? ltp });
				count++;
			}
		}

		logInfo("LTP REST seed complete", { count });
	} catch (err) {
		logError("LTP REST fetch error", { message: err.message });
	}
};
