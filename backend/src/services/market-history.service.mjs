import fetch from "node-fetch";
import { getAnalyticsToken } from "../providers/analytics-token.provider.mjs";
import { AppError } from "../errors/app-error.mjs";
import { logError, logInfo } from "../utils/logger.mjs";

const CANDLE_URL = "https://api.upstox.com/v3/historical-candle";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour — daily candles change once per trading day

// Calendar days to look back per range. ALL = 5 years (Upstox serves this in one call).
export const RANGE_DAYS = {
	"1W": 7,
	"1M": 30,
	"3M": 90,
	"6M": 180,
	"1Y": 365,
	ALL: 365 * 5,
};

// instrumentKey|range → { data, expiresAt }
const historyCache = new Map();

const toIsoDate = (d) => d.toISOString().split("T")[0];

/**
 * Upstox returns candles newest-first as
 *   [timestamp, open, high, low, close, volume, oi]
 * Normalise to ascending [{ date: "YYYY-MM-DD", price: close, open, high, low, volume }].
 */
export const normalizeCandles = (candles) => {
	if (!Array.isArray(candles)) return [];
	const rows = [];
	for (const c of candles) {
		if (!Array.isArray(c) || c.length < 5) continue;
		const [ts, open, high, low, close, volume] = c;
		const date = typeof ts === "string" ? ts.slice(0, 10) : null;
		if (!date || typeof close !== "number") continue;
		rows.push({ date, price: close, open, high, low, volume: volume ?? 0 });
	}
	rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
	return rows;
};

/**
 * Fetch daily close prices for an instrument from Upstox historical candle API.
 * Cached per instrumentKey+range for 1 hour.
 *
 * @param {string} instrumentKey e.g. "NSE_EQ|INE009A01021"
 * @param {"1W"|"1M"|"3M"|"6M"|"1Y"|"ALL"} range
 * @param {{ now?: Date }} [opts] injectable clock for tests
 */
export const fetchPriceHistory = async (instrumentKey, range = "ALL", opts = {}) => {
	const days = RANGE_DAYS[range];
	if (!days) throw new AppError(`Unsupported range '${range}'`, 400);

	const cacheKey = `${instrumentKey}|${range}`;
	const cached = historyCache.get(cacheKey);
	if (cached && Date.now() < cached.expiresAt) return cached.data;

	const now = opts.now ?? new Date();
	const from = new Date(now);
	from.setDate(from.getDate() - days);

	const url = `${CANDLE_URL}/${encodeURIComponent(instrumentKey)}/days/1/${toIsoDate(now)}/${toIsoDate(from)}`;

	let res;
	try {
		res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${getAnalyticsToken()}`,
				Accept: "application/json",
			},
		});
	} catch (err) {
		logError("Price history fetch error", { message: err.message, instrumentKey, range });
		throw new AppError("Unable to reach market data provider", 502);
	}

	if (!res.ok) {
		let detail = "";
		try {
			const body = await res.json();
			detail = body?.errors?.[0]?.message ?? "";
		} catch {
			// non-JSON body
		}
		logError("Price history API failed", { status: res.status, detail, instrumentKey, range });
		throw new AppError(`Market data provider error (${res.status})`, 502);
	}

	const json = await res.json();
	if (json.status !== "success" || !json.data) {
		logError("Price history unexpected response", { body: JSON.stringify(json).slice(0, 200) });
		throw new AppError("Unexpected market data response", 502);
	}

	const data = normalizeCandles(json.data.candles);
	logInfo("Price history fetched", { instrumentKey, range, count: data.length });
	historyCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
	return data;
};

/** Test helper — clears the in-memory cache. */
export const clearPriceHistoryCache = () => historyCache.clear();
