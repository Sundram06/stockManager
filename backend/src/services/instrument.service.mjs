import fetch from "node-fetch";
import instruments from "../../assets/instruments.json" assert { type: "json" };
import { getAnalyticsToken } from "../providers/analytics-token.provider.mjs";
import { logError, logInfo } from "../utils/logger.mjs";

const SEARCH_URL = "https://api.upstox.com/v2/instruments/search";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Per-query cache: normalizedQuery → { data, expiresAt }
const searchCache = new Map();

/**
 * Search instruments via Upstox Instrument Search API (v2).
 * Falls back to local instruments.json if the API call fails.
 * Results cached per query for 1 hour.
 */
export const searchInstruments = async (query) => {
	const key = query.toLowerCase().trim();

	const cached = searchCache.get(key);
	if (cached && Date.now() < cached.expiresAt) {
		return cached.data;
	}

	try {
		const token = getAnalyticsToken();
		const url = `${SEARCH_URL}?query=${encodeURIComponent(key)}&exchanges=NSE&segments=EQ`;

		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});

		if (!res.ok) {
			logError("Instrument search API failed, falling back to local", { status: res.status, query: key });
			return localSearch(key);
		}

		const json = await res.json();
		if (json.status !== "success" || !Array.isArray(json.data)) {
			logError("Instrument search unexpected response, falling back to local", { body: JSON.stringify(json).slice(0, 200) });
			return localSearch(key);
		}

		const data = json.data.map((i) => ({
			name: i.name,
			trading_symbol: i.trading_symbol,
			instrument_key: i.instrument_key,
			exchange: i.exchange,
		}));

		logInfo("Instrument search API success", { query: key, count: data.length });
		searchCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
		return data;
	} catch (err) {
		logError("Instrument search error, falling back to local", { message: err.message, query: key });
		return localSearch(key);
	}
};

// Local fallback — searches instruments.json in-memory
const localSearch = (q) => {
	const results = [];
	for (const i of instruments) {
		if (results.length >= 25) break;
		const nameMatch = i.name && i.name.toLowerCase().includes(q);
		const symbolMatch = i.trading_symbol && i.trading_symbol.toLowerCase().includes(q);
		if (nameMatch || symbolMatch) results.push(i);
	}
	return results;
};
