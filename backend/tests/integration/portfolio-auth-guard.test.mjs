import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.mjs";

describe("portfolio auth guards", () => {
	const app = createApp();

	it("GET /stocks returns 401 without bearer token", async () => {
		const res = await request(app).get("/stocks");
		expect(res.status).toBe(401);
	});

	it("GET /history returns 401 without bearer token", async () => {
		const res = await request(app).get("/history");
		expect(res.status).toBe(401);
	});

	it("POST /history/sell returns 401 without bearer token", async () => {
		const res = await request(app).post("/history/sell").send({});
		expect(res.status).toBe(401);
	});

	it.each([
		["get", "/api/export/json"],
		["get", "/api/export/holdings.csv"],
		["get", "/api/export/transactions.csv"],
		["post", "/api/import/preview"],
		["post", "/api/import/commit"],
		["get", "/api/import/batches"],
		["post", "/api/import/batches/abc/undo"],
	])("%s %s returns 401 without bearer token", async (method, path) => {
		const res = await request(app)[method](path).send({});
		expect(res.status).toBe(401);
	});
});
