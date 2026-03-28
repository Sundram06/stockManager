import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.mjs";

describe("auth validation", () => {
	const app = createApp();

	it("POST /login returns validation error envelope for missing fields", async () => {
		const res = await request(app).post("/login").send({ email: "" });
		expect(res.status).toBe(400);
		expect(typeof res.body.message).toBe("string");
	});
});
