import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const searchInstrumentsMock = vi.fn();
vi.mock("../../src/services/instrument.service.mjs", () => ({ searchInstruments: searchInstrumentsMock }));
vi.mock("../../src/middlewares/authenticate-jwt.mjs", () => ({
	authenticateJWT: (req, res, next) => {
		req.userId = "test-user-id";
		next();
	},
}));

const { createApp } = await import("../../src/app.mjs");
const app = createApp();
const search = (query) => request(app).get(`/api/instruments/search${query}`).set("Authorization", "Bearer fake");

describe("GET /api/instruments/search", () => {
	beforeEach(() => searchInstrumentsMock.mockReset());

	it("searches with the trimmed query", async () => {
		searchInstrumentsMock.mockResolvedValueOnce([{ trading_symbol: "INFY" }]);

		const res = await search("?q=%20infy%20");

		expect(res.status).toBe(200);
		expect(res.body).toEqual([{ trading_symbol: "INFY" }]);
		expect(searchInstrumentsMock).toHaveBeenCalledWith("infy");
	});

	it.each([
		["a missing query", ""],
		["a one-letter query", "?q=a"],
		["a query over 50 characters", `?q=${"a".repeat(51)}`],
		["a repeated parameter, which Express turns into an array", "?q=ab&q=cd"],
	])("answers 400 to %s", async (_label, query) => {
		const res = await search(query);
		expect(res.status).toBe(400);
		expect(searchInstrumentsMock).not.toHaveBeenCalled();
	});
});
