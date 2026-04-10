import fetch from "node-fetch";
import { getAnalyticsToken } from "../providers/analytics-token.provider.mjs";
import { logInfo, logError } from "../utils/logger.mjs";

// ─── Hardcoded NSE holidays ───────────────────────────────────────────────────
// These are the official NSE trading holidays published each year.
// Update this map annually when NSE releases the next year's holiday calendar.
// Dates are "YYYY-MM-DD" in IST (which is what users enter).
const HARDCODED_HOLIDAYS = {
	2025: new Set([
		"2025-02-26", // Mahashivratri
		"2025-03-14", // Holi
		"2025-04-10", // Shri Ram Navami
		"2025-04-14", // Dr. Baba Saheb Ambedkar Jayanti
		"2025-04-18", // Good Friday
		"2025-05-01", // Maharashtra Day
		"2025-08-15", // Independence Day
		"2025-10-02", // Gandhi Jayanti / Dussehra
		"2025-10-20", // Diwali - Laxmi Pujan
		"2025-10-21", // Diwali - Balipratipada
		"2025-11-05", // Prakash Gurpurb Sri Guru Nanak Dev Ji
		"2025-12-25", // Christmas
	]),
	2026: new Set([
		"2026-01-26", // Republic Day
		"2026-03-20", // Holi
		"2026-03-30", // Id-Ul-Fitr (Ramzan Id) — subject to moon sighting
		"2026-04-03", // Good Friday
		"2026-04-14", // Dr. Baba Saheb Ambedkar Jayanti
		"2026-05-01", // Maharashtra Day
		"2026-06-17", // Bakri Id (Eid ul-Adha) — subject to moon sighting
		"2026-10-02", // Gandhi Jayanti
		"2026-11-10", // Diwali - Laxmi Pujan (approx)
		"2026-11-11", // Diwali - Balipratipada (approx)
		"2026-11-25", // Prakash Gurpurb Sri Guru Nanak Dev Ji (approx)
		"2026-12-25", // Christmas
	]),
};

// ─── Upstox API supplement ────────────────────────────────────────────────────
const HOLIDAYS_URL = "https://api.upstox.com/v2/market/holidays/NSE";

// Per-year API cache: { holidays: Set<"YYYY-MM-DD">, fetchedAt: number }
const apiCache = new Map();

async function fetchHolidaysFromApi(year) {
	try {
		const token = getAnalyticsToken();
		const res = await fetch(HOLIDAYS_URL, {
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: "application/json",
			},
		});

		if (!res.ok) {
			logError("Market holidays API fetch failed", { status: res.status });
			return null;
		}

		const json = await res.json();
		if (json.status !== "success" || !Array.isArray(json.data)) {
			logError("Market holidays API unexpected response shape");
			return null;
		}

		// Parse dates robustly — handle "YYYY-MM-DD", "YYYY-MM-DDTHH:mm:ssZ", etc.
		const holidays = new Set(
			json.data
				.map((h) => {
					if (!h.date) return null;
					const d = new Date(h.date);
					return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
				})
				.filter(Boolean)
		);

		logInfo("Market holidays loaded from Upstox API", { count: holidays.size });
		return holidays;
	} catch (err) {
		logError("Market holidays API error", { message: err.message });
		return null;
	}
}

async function getApiHolidaysForYear(year) {
	const cached = apiCache.get(year);
	if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000) {
		return cached.holidays;
	}
	const holidays = await fetchHolidaysFromApi(year);
	if (holidays !== null) {
		apiCache.set(year, { holidays, fetchedAt: Date.now() });
	}
	return holidays;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Checks whether Indian stock markets (NSE/BSE) were open on the given date.
 *
 * Strategy:
 *   1. Block weekends — always reliable.
 *   2. Check the hardcoded NSE holiday list (primary source, always available).
 *   3. Supplement with the Upstox API for years not in the hardcoded list.
 *      If the API is unavailable for those years, we fail open rather than
 *      blocking users from recording trades.
 *
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function checkTradingDate(date) {
	const d = date instanceof Date ? date : new Date(date);

	if (isNaN(d.getTime())) {
		return { allowed: false, reason: "Invalid date provided." };
	}

	// Dates are stored as UTC midnight — use UTC day to match
	const day = d.getUTCDay();
	if (day === 0) return { allowed: false, reason: "Indian stock markets are closed on Sundays." };
	if (day === 6) return { allowed: false, reason: "Indian stock markets are closed on Saturdays." };

	const year = d.getUTCFullYear();
	const dateStr = d.toISOString().split("T")[0]; // "YYYY-MM-DD"

	// ── Hardcoded list (primary) ──────────────────────────────────────────────
	const hardcoded = HARDCODED_HOLIDAYS[year];
	if (hardcoded) {
		if (hardcoded.has(dateStr)) {
			return {
				allowed: false,
				reason: `Indian stock markets were closed on ${formatDate(dateStr)} (public holiday). Please use a valid trading day.`,
			};
		}
		// Year is covered by hardcoded list — also try API to catch anything we missed
		const apiHolidays = await getApiHolidaysForYear(year);
		if (apiHolidays?.has(dateStr)) {
			return {
				allowed: false,
				reason: `Indian stock markets were closed on ${formatDate(dateStr)} (public holiday). Please use a valid trading day.`,
			};
		}
		return { allowed: true };
	}

	// ── API only (for years beyond hardcoded list) ────────────────────────────
	const apiHolidays = await getApiHolidaysForYear(year);
	if (apiHolidays === null) {
		// API unavailable and no hardcoded data — fail open, log warning
		logError("Market calendar unavailable for year, allowing trade without holiday check", { year, date: dateStr });
		return { allowed: true };
	}
	if (apiHolidays.has(dateStr)) {
		return {
			allowed: false,
			reason: `Indian stock markets were closed on ${formatDate(dateStr)} (public holiday). Please use a valid trading day.`,
		};
	}
	return { allowed: true };
}

function formatDate(dateStr) {
	// "2026-01-26" → "26 Jan 2026"
	const d = new Date(dateStr + "T00:00:00Z");
	return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
