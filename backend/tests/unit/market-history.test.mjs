import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

vi.mock("node-fetch", () => ({ default: fetchMock }));
vi.mock("../../src/providers/analytics-token.provider.mjs", () => ({
	getAnalyticsToken: () => "test-analytics-token",
}));

const {
	normalizeCandles,
	fetchPriceHistory,
	clearPriceHistoryCache,
	RANGE_DAYS,
} = await import("../../src/services/market-history.service.mjs");

const upstoxOk = (candles) => ({
	ok: true,
	status: 200,
	json: async () => ({ status: "success", data: { candles } }),
});

describe("normalizeCandles", () => {
	it("maps Upstox rows to ascending {date, price} using close", () => {
		const out = normalizeCandles([
			["2026-09-04T00:00:00+05:30", 1133, 1146.7, 1125.4, 1130, 5881388, 0],
			["2026-09-03T00:00:00+05:30", 1144, 1144, 1122.5, 1130.3, 5786250, 0],
		]);
		expect(out).toEqual([
			{ date: "2026-09-03", price: 1130.3, open: 1144, high: 1144, low: 1122.5, volume: 5786250 },
			{ date: "2026-09-04", price: 1130, open: 1133, high: 1146.7, low: 1125.4, volume: 5881388 },
		]);
	});

	it("skips malformed rows and tolerates non-array input", () => {
		expect(normalizeCandles(null)).toEqual([]);
		expect(normalizeCandles([["bad"], null, ["2026-01-02T00:00:00+05:30", 1, 2, 3, "x"]])).toEqual([]);
	});
});

describe("fetchPriceHistory", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		clearPriceHistoryCache();
	});
	afterEach(() => vi.useRealTimers());

	it("builds the Upstox URL from range and encodes the pipe in the key", async () => {
		fetchMock.mockResolvedValueOnce(upstoxOk([]));
		const now = new Date("2026-09-06T12:00:00Z");

		await fetchPriceHistory("NSE_EQ|INE009A01021", "1M", { now });

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe(
			"https://api.upstox.com/v3/historical-candle/NSE_EQ%7CINE009A01021/days/1/2026-09-06/2026-08-07",
		);
		expect(init.headers.Authorization).toBe("Bearer test-analytics-token");
	});

	it("defaults to ALL (5 years)", () => {
		expect(RANGE_DAYS.ALL).toBe(365 * 5);
	});

	it("caches by instrumentKey + range", async () => {
		fetchMock.mockResolvedValue(upstoxOk([["2026-09-04T00:00:00+05:30", 1, 1, 1, 10, 0, 0]]));

		const a = await fetchPriceHistory("NSE_EQ|X", "1Y");
		const b = await fetchPriceHistory("NSE_EQ|X", "1Y");
		await fetchPriceHistory("NSE_EQ|X", "1M");

		expect(a).toBe(b);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it("throws AppError 502 when Upstox responds non-2xx", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({ errors: [{ message: "No segments active" }] }),
		});

		await expect(fetchPriceHistory("NSE_EQ|X", "1Y")).rejects.toMatchObject({
			name: "AppError",
			statusCode: 502,
		});
	});

	it("throws AppError 502 when fetch itself fails", async () => {
		fetchMock.mockRejectedValueOnce(new Error("ECONNRESET"));
		await expect(fetchPriceHistory("NSE_EQ|X", "1Y")).rejects.toMatchObject({ statusCode: 502 });
	});

	it("rejects unknown range with 400", async () => {
		await expect(fetchPriceHistory("NSE_EQ|X", "2Y")).rejects.toMatchObject({ statusCode: 400 });
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
