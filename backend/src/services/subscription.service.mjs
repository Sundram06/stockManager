import instruments from "../../assets/instruments.json" with { type: "json" };
import { Stock } from "../models/stock.model.mjs";

// Fallback maps built from instruments.json for stocks that pre-date Phase 1 (no instrumentKey in DB)
const symbolToKeyFallback = new Map(instruments.map((i) => [i.trading_symbol, i.instrument_key]));
const keyToSymbol = new Map(instruments.map((i) => [i.instrument_key, i.trading_symbol]));

const activeInstrumentKeys = new Set();
let onChangeCallback = null;

export const subscriptionService = {
	async syncFromDB() {
		const stocks = await Stock.find({ quantity: { $gt: 0 } })
			.select("stockName instrumentKey")
			.lean();

		activeInstrumentKeys.clear();
		const seen = new Set();

		for (const stock of stocks) {
			if (seen.has(stock.stockName)) continue;
			seen.add(stock.stockName);

			// Prefer DB-stored instrumentKey (Phase 1); fall back to instruments.json for old stocks
			const key = stock.instrumentKey || symbolToKeyFallback.get(stock.stockName);
			if (!key) continue;

			activeInstrumentKeys.add(key);
			// Keep keyToSymbol up to date for DB-sourced keys not in instruments.json
			if (!keyToSymbol.has(key)) {
				keyToSymbol.set(key, stock.stockName);
			}
		}

		return [...activeInstrumentKeys];
	},

	getActiveKeys() {
		return [...activeInstrumentKeys];
	},

	// Called after creating a new stock. instrumentKey comes from the DB-saved stock (Phase 1)
	// or falls back to instruments.json lookup for old flow.
	addSymbol(symbol, instrumentKey) {
		const key = instrumentKey || symbolToKeyFallback.get(symbol);
		if (!key || activeInstrumentKeys.has(key)) return;
		activeInstrumentKeys.add(key);
		if (!keyToSymbol.has(key)) {
			keyToSymbol.set(key, symbol);
		}
		onChangeCallback?.([key]);
	},

	symbolForKey(instrumentKey) {
		return keyToSymbol.get(instrumentKey) ?? instrumentKey;
	},

	// Set by server.mjs to wire subscription changes → Upstox subscribe call
	onSubscriptionChange(callback) {
		onChangeCallback = callback;
	},
};
