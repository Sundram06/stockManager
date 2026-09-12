import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchPriceHistoryMock = vi.fn();
const keyForSymbolMock = vi.fn();

vi.mock("../../src/services/market-history.service.mjs", () => ({
	fetchPriceHistory: fetchPriceHistoryMock,
}));

vi.mock("../../src/services/subscription.service.mjs", () => ({
	subscriptionService: {
		keyForSymbol: keyForSymbolMock,
		symbolForKey: (k) => k,
		addSymbol: () => {},
		syncFromDB: async () => [],
		onSubscriptionChange: () => {},
	},
}));

const { createApp } = await import("../../src/app.mjs");

describe("GET /api/market/history/:instrument", () => {
	const app = createApp();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 401 without bearer token", async () => {
		const res = await request(app).get("/api/market/history/NSE_EQ%7CINE009A01021");
		expect(res.status).toBe(401);
		expect(fetchPriceHistoryMock).not.toHaveBeenCalled();
	});
});

describe("GET /api/market/history/:instrument (authenticated)", () => {
	let app;

	beforeEach(async () => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.doMock("../../src/middlewares/authenticate-jwt.mjs", () => ({
			authenticateJWT: (req, res, next) => {
				req.userId = "test-user-id";
				next();
			},
		}));
		vi.doMock("../../src/services/market-history.service.mjs", () => ({
			fetchPriceHistory: fetchPriceHistoryMock,
		}));
		vi.doMock("../../src/services/subscription.service.mjs", () => ({
			subscriptionService: {
				keyForSymbol: keyForSymbolMock,
				symbolForKey: (k) => k,
				addSymbol: () => {},
				syncFromDB: async () => [],
				onSubscriptionChange: () => {},
			},
		}));
		const mod = await import("../../src/app.mjs");
		app = mod.createApp();
	});

	it("decodes the pipe key, defaults range to ALL, returns candles envelope", async () => {
		fetchPriceHistoryMock.mockResolvedValueOnce([{ date: "2026-09-04", price: 1130 }]);

		const res = await request(app)
			.get("/api/market/history/NSE_EQ%7CINE009A01021")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(res.body).toEqual({
			instrumentKey: "NSE_EQ|INE009A01021",
			range: "ALL",
			candles: [{ date: "2026-09-04", price: 1130 }],
		});
		expect(fetchPriceHistoryMock).toHaveBeenCalledWith("NSE_EQ|INE009A01021", "ALL");
		expect(keyForSymbolMock).not.toHaveBeenCalled();
	});

	it("passes a valid range through", async () => {
		fetchPriceHistoryMock.mockResolvedValueOnce([]);

		const res = await request(app)
			.get("/api/market/history/NSE_EQ%7CINE009A01021?range=3M")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(fetchPriceHistoryMock).toHaveBeenCalledWith("NSE_EQ|INE009A01021", "3M");
	});

	it("rejects an invalid range with 400 before hitting the service", async () => {
		const res = await request(app)
			.get("/api/market/history/NSE_EQ%7CINE009A01021?range=2Y")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(400);
		expect(fetchPriceHistoryMock).not.toHaveBeenCalled();
	});

	it("resolves a bare trading symbol via instruments.json fallback", async () => {
		keyForSymbolMock.mockReturnValueOnce("NSE_EQ|INE009A01021");
		fetchPriceHistoryMock.mockResolvedValueOnce([]);

		const res = await request(app)
			.get("/api/market/history/INFY?range=1Y")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(keyForSymbolMock).toHaveBeenCalledWith("INFY");
		expect(res.body.instrumentKey).toBe("NSE_EQ|INE009A01021");
	});

	it("returns 404 when a symbol cannot be resolved", async () => {
		keyForSymbolMock.mockReturnValueOnce(null);

		const res = await request(app)
			.get("/api/market/history/NOPE")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(404);
		expect(fetchPriceHistoryMock).not.toHaveBeenCalled();
	});

	it("surfaces provider failures as 502 in the standard error envelope", async () => {
		const { AppError } = await import("../../src/errors/app-error.mjs");
		fetchPriceHistoryMock.mockRejectedValueOnce(new AppError("Market data provider error (401)", 502));

		const res = await request(app)
			.get("/api/market/history/NSE_EQ%7CINE009A01021")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(502);
		expect(res.body.success).toBe(false);
		expect(res.body.message).toMatch(/provider/i);
	});
});
