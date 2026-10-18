import { describe, expect, it } from "vitest";
import { liveStockMetrics, portfolioTotals } from "../util/portfolioMetrics.mjs";
import { percent, rupee, signedRupee } from "../util/format.mjs";

const infy = { _id: "s1", stockName: "INFY", quantity: 10, avgPrice: 1500 };
const itc = { _id: "s2", stockName: "ITC", quantity: 50, avgPrice: 410 };

describe("liveStockMetrics", () => {
	it("values a holding against the live price", () => {
		const m = liveStockMetrics({
			quantity: 10,
			avgPrice: 1500,
			totalInvested: 15000,
			live: { ltp: 1600, cp: 1580 },
		});

		expect(m).toMatchObject({
			currentValue: 16000,
			pnl: 1000,
			dayChange: 200,
		});
		expect(m.pnlPct).toBeCloseTo(6.6667, 3);
		expect(m.dayChangePct).toBeCloseTo(1.2658, 3);
	});

	it("reports a loss without flipping any sign", () => {
		const m = liveStockMetrics({ quantity: 4, avgPrice: 1000, live: { ltp: 900, cp: 950 } });
		expect(m.pnl).toBe(-400);
		expect(m.pnlPct).toBeCloseTo(-10, 6);
		expect(m.dayChange).toBe(-200);
	});

	it("returns nulls, not zeros, when no price has arrived", () => {
		const m = liveStockMetrics({ quantity: 10, avgPrice: 1500, totalInvested: 15000, live: undefined });
		expect(m).toMatchObject({ ltp: null, currentValue: null, pnl: null, pnlPct: null, dayChange: null });
		expect(m.totalInvested).toBe(15000);
	});

	it("leaves day change null when the previous close is missing", () => {
		const m = liveStockMetrics({ quantity: 10, avgPrice: 1500, live: { ltp: 1600 } });
		expect(m.pnl).toBe(1000);
		expect(m.dayChange).toBeNull();
		expect(m.dayChangePct).toBeNull();
	});

	it("rounds money to paise so every screen agrees", () => {
		const m = liveStockMetrics({ quantity: 3, avgPrice: 100.333, live: { ltp: 110.777 } });
		expect(m.pnl).toBe(31.33);
		expect(m.currentValue).toBe(332.33);
	});
});

describe("portfolioTotals", () => {
	const activeStockMetrics = {
		s1: { totalInvested: 15000, avgPrice: 1500 },
		s2: { totalInvested: 20500, avgPrice: 410 },
	};

	it("adds up holdings and names the best and worst", () => {
		const totals = portfolioTotals({
			stocks: [infy, itc],
			activeStockMetrics,
			ltpMap: { INFY: { ltp: 1600, cp: 1580 }, ITC: { ltp: 400, cp: 405 } },
		});

		expect(totals).toMatchObject({
			totalInvested: 35500,
			currentValue: 36000,
			unrealizedPnl: 500,
			dayChange: -50,
			hasLiveData: true,
		});
		expect(totals.best.name).toBe("INFY");
		expect(totals.worst.name).toBe("ITC");
	});

	it("still reports what was invested when no prices have arrived", () => {
		const totals = portfolioTotals({ stocks: [infy, itc], activeStockMetrics, ltpMap: {} });

		expect(totals.totalInvested).toBe(35500);
		expect(totals.hasLiveData).toBe(false);
		expect(totals.currentValue).toBeNull();
		expect(totals.unrealizedPnl).toBeNull();
		expect(totals.best).toBeNull();
	});

	it("counts only the holdings that have a price", () => {
		const totals = portfolioTotals({
			stocks: [infy, itc],
			activeStockMetrics,
			ltpMap: { INFY: { ltp: 1600, cp: 1580 } },
		});

		expect(totals.currentValue).toBe(16000);
		expect(totals.best.name).toBe("INFY");
		expect(totals.worst.name).toBe("INFY");
	});

	it("ignores sold-out holdings", () => {
		const totals = portfolioTotals({
			stocks: [{ ...infy, quantity: 0 }],
			activeStockMetrics,
			ltpMap: { INFY: { ltp: 1600, cp: 1580 } },
		});

		expect(totals).toMatchObject({ totalInvested: 0, currentValue: null, hasLiveData: false });
	});
});

describe("formatting", () => {
	it("groups digits the Indian way", () => {
		expect(rupee(123456.78)).toBe("₹1,23,456.78");
		expect(rupee(123456.78, { decimals: 0 })).toBe("₹1,23,457");
	});

	it("shows direction with a real minus sign", () => {
		expect(signedRupee(1200)).toBe("+₹1,200");
		expect(signedRupee(-1200)).toBe("−₹1,200");
		expect(signedRupee(0)).toBe("₹0");
	});

	it("drops the sign when asked for a bare amount", () => {
		expect(rupee(-1200, { absolute: true })).toBe("₹1,200");
	});

	it.each([null, undefined, Number.NaN, "1200"])("shows a dash for %s", (value) => {
		expect(rupee(value)).toBe("—");
		expect(percent(value)).toBeNull();
	});

	it("always signs a percentage", () => {
		expect(percent(6.6667)).toBe("+6.67%");
		expect(percent(-3)).toBe("-3.00%");
	});
});
