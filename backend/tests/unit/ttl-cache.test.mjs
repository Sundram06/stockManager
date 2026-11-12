import { afterEach, describe, expect, it, vi } from "vitest";
import { TtlCache } from "../../src/utils/ttl-cache.mjs";

describe("TtlCache", () => {
	afterEach(() => vi.useRealTimers());

	it("returns a value until its time to live passes", () => {
		vi.useFakeTimers();
		const cache = new TtlCache({ maxEntries: 10, ttlMs: 1000 });
		cache.set("a", 1);

		vi.advanceTimersByTime(999);
		expect(cache.get("a")).toBe(1);
		vi.advanceTimersByTime(1);
		expect(cache.get("a")).toBeUndefined();
		expect(cache.size).toBe(0);
	});

	it("never holds more than maxEntries, dropping the least recently used", () => {
		const cache = new TtlCache({ maxEntries: 2, ttlMs: 60_000 });
		cache.set("a", 1);
		cache.set("b", 2);
		cache.get("a");
		cache.set("c", 3);

		expect(cache.size).toBe(2);
		expect(cache.get("b")).toBeUndefined();
		expect(cache.get("a")).toBe(1);
		expect(cache.get("c")).toBe(3);
	});

	it("stays bounded under many distinct keys", () => {
		const cache = new TtlCache({ maxEntries: 500, ttlMs: 60_000 });
		for (let i = 0; i < 10_000; i += 1) cache.set(`query-${i}`, i);
		expect(cache.size).toBe(500);
	});
});
