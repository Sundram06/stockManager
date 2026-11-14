import { describe, expect, it, vi } from "vitest";
import { loadOrReload, shouldReload } from "../util/lazyWithReload.mjs";

function memoryStorage() {
	const data = new Map();
	return {
		getItem: (k) => (data.has(k) ? data.get(k) : null),
		setItem: (k, v) => data.set(k, String(v)),
	};
}

function fakeWindow({ online = true } = {}) {
	return {
		sessionStorage: memoryStorage(),
		navigator: { onLine: online },
		location: { reload: vi.fn() },
	};
}

const missingChunk = () => Promise.reject(new TypeError("Failed to fetch dynamically imported module"));

async function settlesWithin(promise, ms = 50) {
	const pending = Symbol("pending");
	const result = await Promise.race([
		promise.then(
			() => "resolved",
			() => "rejected",
		),
		new Promise((r) => setTimeout(() => r(pending), ms)),
	]);
	return result === pending ? "pending" : result;
}

describe("shouldReload", () => {
	it("reloads on the first failure", () => {
		expect(shouldReload({ storage: memoryStorage(), now: 1_000_000, online: true })).toBe(true);
	});

	it("does not reload again within ten seconds, so a missing chunk cannot loop", () => {
		const storage = memoryStorage();
		shouldReload({ storage, now: 1_000_000, online: true });
		expect(shouldReload({ storage, now: 1_009_999, online: true })).toBe(false);
	});

	it("reloads again for a later deploy", () => {
		const storage = memoryStorage();
		shouldReload({ storage, now: 1_000_000, online: true });
		expect(shouldReload({ storage, now: 1_010_000, online: true })).toBe(true);
	});

	it("does not reload while offline, since the new page could not load either", () => {
		const storage = memoryStorage();
		expect(shouldReload({ storage, now: 1_000_000, online: false })).toBe(false);
		expect(shouldReload({ storage, now: 1_000_001, online: true })).toBe(true);
	});

	it("does not reload when storage is blocked, since nothing could stop a loop", () => {
		const storage = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {},
		};
		expect(shouldReload({ storage, now: 1_000_000, online: true })).toBe(false);
	});
});

describe("loadOrReload", () => {
	it("returns the module when it loads", async () => {
		const win = fakeWindow();
		const mod = { default: () => null };
		await expect(loadOrReload(() => Promise.resolve(mod), win)).resolves.toBe(mod);
		expect(win.location.reload).not.toHaveBeenCalled();
	});

	it("reloads and stays pending, so no error page shows before the new page arrives", async () => {
		const win = fakeWindow();
		const result = loadOrReload(missingChunk, win);
		expect(await settlesWithin(result)).toBe("pending");
		expect(win.location.reload).toHaveBeenCalledTimes(1);
	});

	it("passes the error on when it already reloaded, so a real failure still shows", async () => {
		const win = fakeWindow();
		loadOrReload(missingChunk, win);
		await expect(loadOrReload(missingChunk, win)).rejects.toThrow("Failed to fetch");
		expect(win.location.reload).toHaveBeenCalledTimes(1);
	});

	it("passes the error on when offline", async () => {
		const win = fakeWindow({ online: false });
		await expect(loadOrReload(missingChunk, win)).rejects.toThrow("Failed to fetch");
		expect(win.location.reload).not.toHaveBeenCalled();
	});
});
