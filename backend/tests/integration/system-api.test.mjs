import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.mjs";

describe("system routes", () => {
	const app = createApp();

	it("GET /healthz returns ok", async () => {
		const res = await request(app).get("/healthz");
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: "ok" });
		expect(typeof res.headers["x-request-id"]).toBe("string");
	});

	it("unknown route returns standardized not-found envelope", async () => {
		const res = await request(app).get("/unknown-route");
		expect(res.status).toBe(404);
		expect(res.body.message).toBe("Route not found");
		expect(res.body.success).toBe(false);
		expect(typeof res.body.error?.requestId).toBe("string");
	});
});
