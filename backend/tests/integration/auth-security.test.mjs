// Login, logout, password reset and Google sign-in against a real database:
// what a response may reveal, how often it may be tried, and when a token stops working.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server-core";

process.env.JWT_SECRET = "test-secret";

const emails = vi.hoisted(() => ({
	sendPasswordResetEmail: vi.fn(async () => {}),
	sendVerificationEmail: vi.fn(async () => {}),
	sendGoogleAccountNotice: vi.fn(async () => {}),
}));
vi.mock("../../src/utils/email.mjs", () => emails);

const { createApp } = await import("../../src/app.mjs");
const { User, LoginCode } = await import("../../src/models/index.mjs");
const { createLoginCode } = await import("../../src/services/login-code.service.mjs");
const { googleOAuthCallback } = await import("../../src/controllers/auth.controller.mjs");

const PASSWORD = "correct-horse";
let mongo;
let app;

const createUser = (email, overrides = {}) =>
	User.create({ name: "Test", email, password: PASSWORD, provider: "local", isEmailVerified: true, ...overrides });

const login = (email, password = PASSWORD) => request(app).post("/login").send({ email, password });
const me = (token) => request(app).get("/api/me").set("Authorization", `Bearer ${token}`);

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	await mongoose.connect(mongo.getUri());
	await Promise.all([User.init(), LoginCode.init()]);
	app = createApp();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongo?.stop();
});

beforeEach(async () => {
	await Promise.all([User.deleteMany({}), LoginCode.deleteMany({})]);
	vi.clearAllMocks();
});

const SECRET_FIELDS = [
	"password",
	"resetPasswordToken",
	"resetPasswordExpires",
	"emailVerificationToken",
	"emailVerificationExpires",
	"tokenVersion",
];

describe("user data in responses", () => {
	it("leaves password and token hashes out of the login and /api/me responses", async () => {
		await createUser("a@example.com", { resetPasswordToken: "hash", emailVerificationToken: "hash" });

		const res = await login("a@example.com");
		expect(res.status).toBe(200);
		expect(res.body.user.email).toBe("a@example.com");
		for (const field of SECRET_FIELDS) expect(res.body.user).not.toHaveProperty(field);

		const profile = await me(res.body.token);
		expect(profile.status).toBe(200);
		for (const field of SECRET_FIELDS) expect(profile.body).not.toHaveProperty(field);
	});
});

describe("login answers", () => {
	it("gives the same answer for an unknown email, a wrong password and a Google-only account", async () => {
		await createUser("local@example.com");
		await User.create({ name: "G", email: "google@example.com", provider: "google", googleId: "g1" });

		const answers = await Promise.all([
			login("nobody@example.com"),
			login("local@example.com", "wrong-password"),
			login("google@example.com"),
		]);

		for (const res of answers) {
			expect(res.status).toBe(401);
			expect(res.body.code).toBe("INVALID_CREDENTIALS");
		}
		expect(new Set(answers.map((r) => r.body.message)).size).toBe(1);
	});

	it("reveals an unverified email only to someone who knows the password", async () => {
		await createUser("new@example.com", { isEmailVerified: false });

		expect((await login("new@example.com", "wrong-password")).body.code).toBe("INVALID_CREDENTIALS");
		const right = await login("new@example.com");
		expect(right.status).toBe(403);
		expect(right.body.code).toBe("EMAIL_NOT_VERIFIED");
	});

	it("gives forgot-password the same answer for every address, and emails Google users a notice instead of a link", async () => {
		await createUser("local@example.com");
		await User.create({ name: "G", email: "google@example.com", provider: "google", googleId: "g1" });

		const bodies = [];
		for (const email of ["nobody@example.com", "local@example.com", "google@example.com"]) {
			const res = await request(app).post("/api/forgot-password").send({ email });
			expect(res.status).toBe(200);
			bodies.push(res.body.message);
		}

		expect(new Set(bodies).size).toBe(1);
		expect(emails.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
		expect(emails.sendGoogleAccountNotice).toHaveBeenCalledWith(expect.objectContaining({ to: "google@example.com" }));
	});
});

describe("rate limits", () => {
	it("blocks an account after 10 failed logins, even with the right password, and leaves other accounts alone", async () => {
		await createUser("target@example.com");
		await createUser("other@example.com");

		for (let i = 0; i < 10; i += 1) {
			expect((await login("target@example.com", `guess-${i}`)).status).toBe(401);
		}

		const blocked = await login("target@example.com");
		expect(blocked.status).toBe(429);
		expect(blocked.body.code).toBe("RATE_LIMITED");
		expect(blocked.body.message).toMatch(/Try again in \d+ minutes?/);

		expect((await login("other@example.com")).status).toBe(200);
	});

	it("sends at most 3 password emails per address per hour", async () => {
		await createUser("spam@example.com");
		const statuses = [];
		for (let i = 0; i < 4; i += 1) {
			statuses.push((await request(app).post("/api/forgot-password").send({ email: "spam@example.com" })).status);
		}

		expect(statuses).toEqual([200, 200, 200, 429]);
		expect(emails.sendPasswordResetEmail).toHaveBeenCalledTimes(3);
	});
});

describe("token lifetime", () => {
	it("stops accepting the token after logout", async () => {
		await createUser("out@example.com");
		const { token } = (await login("out@example.com")).body;
		expect((await me(token)).status).toBe(200);

		expect((await request(app).post("/logout").set("Authorization", `Bearer ${token}`)).status).toBe(200);

		expect((await me(token)).status).toBe(403);
		const fresh = (await login("out@example.com")).body.token;
		expect((await me(fresh)).status).toBe(200);
	});

	it("requires a valid token to log out", async () => {
		expect((await request(app).post("/logout")).status).toBe(401);
	});

	it("stops accepting old tokens after a password reset", async () => {
		const user = await createUser("reset@example.com");
		const { token } = (await login("reset@example.com")).body;

		const rawToken = "a".repeat(64);
		user.resetPasswordToken = (await import("../../src/utils/crypto.mjs")).sha256(rawToken);
		user.resetPasswordExpires = new Date(Date.now() + 60_000);
		await user.save();

		const reset = await request(app)
			.post("/api/reset-password")
			.send({ email: "reset@example.com", token: rawToken, newPassword: "new-password" });
		expect(reset.status).toBe(200);
		expect((await me(token)).status).toBe(403);
	});

	it("rejects a token signed with another algorithm, even with the right secret", async () => {
		const user = await createUser("alg@example.com");
		const forged = jwt.sign({ userId: String(user._id), ver: 0 }, "test-secret", { algorithm: "HS512" });
		expect((await me(forged)).status).toBe(403);
	});

	it("accepts a token issued before token versions existed, until the first revocation", async () => {
		const user = await createUser("legacy@example.com");
		const legacy = jwt.sign({ userId: String(user._id) }, "test-secret", { algorithm: "HS256", expiresIn: "1h" });
		expect((await me(legacy)).status).toBe(200);

		await request(app).post("/logout").set("Authorization", `Bearer ${legacy}`);
		expect((await me(legacy)).status).toBe(403);
	});
});

describe("Google sign-in", () => {
	it("redirects with a one-time code in the fragment, never the session token", async () => {
		const user = await createUser("g@example.com");
		const res = { redirect: vi.fn() };

		await googleOAuthCallback({ user }, res);

		const url = res.redirect.mock.calls[0][0];
		expect(url).toMatch(/\/oauth-success#code=[a-f0-9]{64}$/);
		expect(url).not.toContain("token");
	});

	it("exchanges a code for a session exactly once", async () => {
		const user = await createUser("g@example.com");
		const code = await createLoginCode(user._id);

		const first = await request(app).post("/api/auth/google/exchange").send({ code });
		expect(first.status).toBe(200);
		expect(first.body.user.email).toBe("g@example.com");
		expect(first.body.user).not.toHaveProperty("password");
		expect((await me(first.body.token)).status).toBe(200);

		const again = await request(app).post("/api/auth/google/exchange").send({ code });
		expect(again.status).toBe(400);
		expect(again.body.code).toBe("INVALID_LOGIN_CODE");
	});

	it("refuses an expired code and a malformed one", async () => {
		const user = await createUser("g@example.com");
		const code = await createLoginCode(user._id);
		await LoginCode.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });

		expect((await request(app).post("/api/auth/google/exchange").send({ code })).status).toBe(400);
		expect((await request(app).post("/api/auth/google/exchange").send({ code: "not-a-code" })).status).toBe(400);
	});
});
