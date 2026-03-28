import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const registerUserMock = vi.fn();
const loginUserMock = vi.fn();
const getUserProfileMock = vi.fn();
const forgotPasswordMock = vi.fn();
const createUserTokenMock = vi.fn();

const listStocksForUserMock = vi.fn();
const listHistoryForUserMock = vi.fn();

vi.mock("../../src/middlewares/authenticate-jwt.mjs", () => ({
	authenticateJWT: (req, res, next) => {
		req.userId = "contract-user-id";
		next();
	},
}));

vi.mock("../../src/services/auth.service.mjs", () => ({
	registerUser: registerUserMock,
	loginUser: loginUserMock,
	getUserProfile: getUserProfileMock,
	forgotPassword: forgotPasswordMock,
	createUserToken: createUserTokenMock,
}));

vi.mock("../../src/services/stock.service.mjs", () => ({
	createStockForUser: vi.fn(),
	listStocksForUser: listStocksForUserMock,
	deleteAllStocks: vi.fn(),
	deleteStockById: vi.fn(),
}));

vi.mock("../../src/services/history.service.mjs", () => ({
	listHistoryForUser: listHistoryForUserMock,
	createHistory: vi.fn(),
	sellHistory: vi.fn(),
}));

const { createApp } = await import("../../src/app.mjs");

describe("frontend response contract regression", () => {
	const app = createApp();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("POST /register keeps message + user object shape", async () => {
		registerUserMock.mockResolvedValueOnce({
			user: {
				_id: "u1",
				name: "Demo",
				email: "demo@example.com",
			},
		});

		const res = await request(app).post("/register").send({
			name: "Demo",
			email: "demo@example.com",
			password: "secret",
		});

		expect(res.status).toBe(201);
		expect(typeof res.body.message).toBe("string");
		expect(res.body.user).toMatchObject({
			_id: "u1",
			name: "Demo",
			email: "demo@example.com",
		});
	});

	it("POST /login keeps user + token envelope", async () => {
		loginUserMock.mockResolvedValueOnce({
			user: {
				_id: "u2",
				name: "Trader",
				email: "trader@example.com",
			},
			token: "jwt-token",
		});

		const res = await request(app).post("/login").send({
			email: "trader@example.com",
			password: "secret",
		});

		expect(res.status).toBe(200);
		expect(typeof res.body.token).toBe("string");
		expect(res.body.user).toMatchObject({
			_id: "u2",
			email: "trader@example.com",
		});
	});

	it("GET /stocks keeps fields used by frontend metrics/rendering", async () => {
		listStocksForUserMock.mockResolvedValueOnce([
			{
				_id: "s1",
				stockName: "INFY",
				quantity: 4,
				avgPrice: 100,
				totalCostOfStock: 400,
				ltp: 120,
				currVal: 480,
				pnl: 80,
				netChange: 2,
				dayChange: 1,
			},
		]);

		const res = await request(app)
			.get("/stocks")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body[0]).toEqual(
			expect.objectContaining({
				_id: expect.any(String),
				stockName: expect.any(String),
				quantity: expect.any(Number),
				avgPrice: expect.any(Number),
				totalCostOfStock: expect.any(Number),
				ltp: expect.any(Number),
				currVal: expect.any(Number),
				pnl: expect.any(Number),
				netChange: expect.any(Number),
				dayChange: expect.any(Number),
			}),
		);
	});

	it("GET /history keeps fields used by history modal and grouping", async () => {
		listHistoryForUserMock.mockResolvedValueOnce([
			{
				_id: "h1",
				stockId: "s1",
				quantity: 10,
				avgPrice: 100,
				date: "2026-03-01T00:00:00.000Z",
				quantitySold: 3,
				sellingPrice: 120,
				pnl: 60,
			},
		]);

		const res = await request(app)
			.get("/history")
			.set("Authorization", "Bearer fake-token");

		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
		expect(res.body[0]).toEqual(
			expect.objectContaining({
				_id: expect.any(String),
				stockId: expect.any(String),
				quantity: expect.any(Number),
				avgPrice: expect.any(Number),
				date: expect.any(String),
				quantitySold: expect.any(Number),
				sellingPrice: expect.any(Number),
				pnl: expect.any(Number),
			}),
		);
	});
});
