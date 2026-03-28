import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createStockForUserMock = vi.fn();
const listStocksForUserMock = vi.fn();
const deleteAllStocksMock = vi.fn();
const deleteStockByIdMock = vi.fn();
const listHistoryForUserMock = vi.fn();
const createHistoryMock = vi.fn();
const sellHistoryMock = vi.fn();

vi.mock("../../src/middlewares/authenticate-jwt.mjs", () => ({
	authenticateJWT: (req, res, next) => {
		req.userId = "test-user-id";
		next();
	},
}));

vi.mock("../../src/services/stock.service.mjs", () => ({
	createStockForUser: createStockForUserMock,
	listStocksForUser: listStocksForUserMock,
	deleteAllStocks: deleteAllStocksMock,
	deleteStockById: deleteStockByIdMock,
}));

vi.mock("../../src/services/history.service.mjs", () => ({
	listHistoryForUser: listHistoryForUserMock,
	createHistory: createHistoryMock,
	sellHistory: sellHistoryMock,
}));

const { createApp } = await import("../../src/app.mjs");

describe("portfolio routes with authenticated context", () => {
	const app = createApp();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("GET /stocks returns service payload and uses request user", async () => {
		listStocksForUserMock.mockResolvedValueOnce([
			{ _id: "s1", stockName: "INFY", quantity: 3 },
		]);

		const res = await request(app)
			.get("/stocks")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(res.body).toEqual([{ _id: "s1", stockName: "INFY", quantity: 3 }]);
		expect(listStocksForUserMock).toHaveBeenCalledWith("test-user-id");
	});

	it("POST /stocks validates payload before hitting service", async () => {
		const res = await request(app)
			.post("/stocks")
			.set("Authorization", "Bearer fake-token")
			.send({ stockName: "", quantity: "x", avgPrice: "y" });

		expect(res.status).toBe(400);
		expect(createStockForUserMock).not.toHaveBeenCalled();
	});

	it("POST /stocks forwards validated payload to service", async () => {
		createStockForUserMock.mockResolvedValueOnce({
			stockId: "stk1",
			stockName: "RELIANCE",
			quantity: 2,
			avgPrice: 2500,
		});

		const res = await request(app)
			.post("/stocks")
			.set("Authorization", "Bearer fake-token")
			.send({ stockName: "RELIANCE", quantity: 2, avgPrice: 2500 });

		expect(res.status).toBe(200);
		expect(createStockForUserMock).toHaveBeenCalledWith("test-user-id", {
			stockName: "RELIANCE",
			quantity: 2,
			avgPrice: 2500,
		});
	});

	it("POST /history/sell maps service business error to HTTP response", async () => {
		sellHistoryMock.mockResolvedValueOnce({
			error: "Not enough stock to sell",
			statusCode: 400,
		});

		const res = await request(app)
			.post("/history/sell")
			.set("Authorization", "Bearer fake-token")
			.send({ stockId: "stk1", quantity: 10, avgPrice: 150 });

		expect(res.status).toBe(400);
		expect(res.body).toEqual({ message: "Not enough stock to sell" });
		expect(sellHistoryMock).toHaveBeenCalledWith("test-user-id", {
			stockId: "stk1",
			quantity: 10,
			avgPrice: 150,
		});
	});

	it("GET /history returns user-scoped service payload", async () => {
		listHistoryForUserMock.mockResolvedValueOnce([{ _id: "h1", stockId: "stk1" }]);

		const res = await request(app)
			.get("/history")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(res.body).toEqual([{ _id: "h1", stockId: "stk1" }]);
		expect(listHistoryForUserMock).toHaveBeenCalledWith("test-user-id");
	});
});
