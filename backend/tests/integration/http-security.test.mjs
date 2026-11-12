// App-wide protections that need no database: headers, body limits, and
// routes that must be closed or gone.
import { describe, expect, it, vi } from "vitest";
import request from "supertest";

const searchInstrumentsMock = vi.fn(async () => [{ trading_symbol: "INFY" }]);
vi.mock("../../src/services/instrument.service.mjs", () => ({ searchInstruments: searchInstrumentsMock }));

const { createApp } = await import("../../src/app.mjs");
const app = createApp();

describe("security headers", () => {
	it("sets helmet's headers and hides the framework", async () => {
		const res = await request(app).get("/healthz");
		expect(res.headers["x-content-type-options"]).toBe("nosniff");
		expect(res.headers["x-frame-options"]).toBeDefined();
		expect(res.headers["x-powered-by"]).toBeUndefined();
	});
});

describe("request body limits", () => {
	const largeBody = { email: "a@example.com", password: "x".repeat(200 * 1024) };

	it("refuses a body over 100 KB on ordinary routes", async () => {
		const res = await request(app).post("/login").send(largeBody);
		expect(res.status).toBe(413);
		expect(res.body.message).toBe("The request is too large.");
	});

	it("checks authentication before reading a large import body", async () => {
		const res = await request(app).post("/api/import/preview").send({ content: "x".repeat(2 * 1024 * 1024) });
		expect(res.status).toBe(401);
	});
});

describe("removed and closed routes", () => {
	it.each(["/api/upstox/login", "/api/upstocks/callback"])("%s no longer exists", async (path) => {
		expect((await request(app).get(path)).status).toBe(404);
	});

	it("requires a token for instrument search", async () => {
		const res = await request(app).get("/api/instruments/search?q=infy");
		expect(res.status).toBe(401);
		expect(searchInstrumentsMock).not.toHaveBeenCalled();
	});
});
