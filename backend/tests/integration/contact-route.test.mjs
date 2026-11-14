import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

process.env.CONTACT_EMAIL = "owner@example.com";

const sendContactMessage = vi.fn(async () => {});
vi.mock("../../src/utils/email.mjs", () => ({ sendContactMessage }));

const { createApp } = await import("../../src/app.mjs");
const { env } = await import("../../src/config/env.mjs");
const app = createApp();

const valid = { name: "Asha", email: "asha@example.com", message: "How do I import my Groww trades?" };
const send = (body) => request(app).post("/api/contact").send(body);

describe("POST /api/contact", () => {
	beforeEach(() => sendContactMessage.mockClear());

	it("emails the message to the configured address and never returns that address", async () => {
		const res = await send(valid);

		expect(res.status).toBe(200);
		expect(sendContactMessage).toHaveBeenCalledWith({ to: "owner@example.com", ...valid });
		expect(JSON.stringify(res.body)).not.toContain("owner@example.com");
	});

	it.each([
		["a missing name", { ...valid, name: "" }],
		["a name with a line break", { ...valid, name: "Asha\r\nBcc: x@example.com" }],
		["an invalid email", { ...valid, email: "not-an-email" }],
		["a very short message", { ...valid, message: "hi" }],
		["a filled hidden field", { ...valid, website: "http://spam.example" }],
	])("refuses %s", async (_label, body) => {
		const res = await send(body);
		expect(res.status).toBe(400);
		expect(sendContactMessage).not.toHaveBeenCalled();
	});

	it("allows 3 messages per sender per hour", async () => {
		const sender = { ...valid, email: "busy@example.com" };
		const statuses = [];
		for (let i = 0; i < 4; i += 1) statuses.push((await send(sender)).status);
		expect(statuses).toEqual([200, 200, 200, 429]);
	});

	it("answers 503 when no contact address is configured", async () => {
		const saved = env.CONTACT_EMAIL;
		env.CONTACT_EMAIL = "";
		try {
			const res = await send({ ...valid, email: "later@example.com" });
			expect(res.status).toBe(503);
			expect(res.body.code).toBe("CONTACT_UNAVAILABLE");
		} finally {
			env.CONTACT_EMAIL = saved;
		}
	});
});
