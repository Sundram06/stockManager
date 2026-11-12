import { describe, expect, it, vi } from "vitest";
import { createCookieStateStore } from "../../src/providers/oauth-state-store.mjs";

const fakeRequest = (cookies = {}) => ({ cookies, res: { cookie: vi.fn(), clearCookie: vi.fn() } });
const verify = (store, req, state) =>
	new Promise((resolve) => store.verify(req, state, (err, ok, info) => resolve({ err, ok, info })));

describe("cookie OAuth state store", () => {
	const store = createCookieStateStore({ secure: true });

	it("keeps the arities passport-oauth2 dispatches on", () => {
		expect(store.store.length).toBe(3);
		expect(store.verify.length).toBe(3);
	});

	it("stores a random state in an httpOnly, secure, lax cookie scoped to the Google routes", () => {
		const req = fakeRequest();
		let state;
		store.store(req, {}, (err, value) => {
			state = value;
		});

		expect(state).toMatch(/^[a-f0-9]{48}$/);
		const [name, value, options] = req.res.cookie.mock.calls[0];
		expect(value).toBe(state);
		expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/api/auth/google" });
		expect(name).toBeTruthy();
	});

	it("accepts the callback only when the state matches the cookie, and clears the cookie either way", async () => {
		const req = fakeRequest();
		let state;
		store.store(req, {}, (err, value) => {
			state = value;
		});
		const cookieName = req.res.cookie.mock.calls[0][0];

		const match = fakeRequest({ [cookieName]: state });
		expect((await verify(store, match, state)).ok).toBe(true);
		expect(match.res.clearCookie).toHaveBeenCalled();

		const otherBrowser = fakeRequest();
		expect((await verify(store, otherBrowser, state)).ok).toBe(false);
		expect(otherBrowser.res.clearCookie).toHaveBeenCalled();

		expect((await verify(store, fakeRequest({ [cookieName]: state }), "forged")).ok).toBe(false);
	});
});
