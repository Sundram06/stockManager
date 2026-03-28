import { EventEmitter } from "events";

class MarketCacheService extends EventEmitter {
	#cache = new Map(); // instrumentKey → { ltp, cp, ts }

	updateLTP(instrumentKey, data) {
		this.#cache.set(instrumentKey, {
			ltp: data.ltp,
			cp: data.cp,
			ts: Date.now(),
		});
		this.emit("update", instrumentKey, data);
	}

	getLTP(instrumentKey) {
		return this.#cache.get(instrumentKey) ?? null;
	}

	getAll() {
		return Object.fromEntries(this.#cache);
	}
}

export const marketCache = new MarketCacheService();
