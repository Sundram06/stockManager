/**
 * In-memory cache with a time-to-live per entry and a cap on entry count.
 * Past the cap, the least recently used entry is dropped, so memory stays
 * bounded however many distinct keys callers send.
 */
export class TtlCache {
	#entries = new Map();

	constructor({ maxEntries, ttlMs }) {
		this.maxEntries = maxEntries;
		this.ttlMs = ttlMs;
	}

	get(key) {
		const entry = this.#entries.get(key);
		if (!entry) return undefined;
		if (Date.now() >= entry.expiresAt) {
			this.#entries.delete(key);
			return undefined;
		}
		// Re-insert so Map order tracks recency.
		this.#entries.delete(key);
		this.#entries.set(key, entry);
		return entry.value;
	}

	set(key, value) {
		this.#entries.delete(key);
		this.#entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
		while (this.#entries.size > this.maxEntries) {
			this.#entries.delete(this.#entries.keys().next().value);
		}
	}

	clear() {
		this.#entries.clear();
	}

	get size() {
		return this.#entries.size;
	}
}
