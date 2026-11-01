import { Stock } from "../models/stock.model.mjs";
import { instrumentMaster } from "./instrument-master.service.mjs";

// Keys learned from stocks in the database, for symbols the instrument list
// does not know.
const keyToSymbol = new Map();

const activeInstrumentKeys = new Set();
let onChangeCallback = null;

/**
 * The key to price a stock with. A stored key wins, unless Upstox's live list
 * no longer has it: that happens after a split changes the ISIN, and the old
 * key then returns no price at all. The override only applies when the list
 * really came from Upstox; the bundled fallback is older than most stored keys.
 */
function resolveKey(symbol, storedKey) {
	const live = instrumentMaster.status().source === "upstox";
	if (storedKey && (!live || instrumentMaster.hasKey(storedKey))) return storedKey;
	return instrumentMaster.keyForSymbol(symbol) ?? storedKey ?? null;
}

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

			const key = resolveKey(stock.stockName, stock.instrumentKey);
			if (!key) continue;

			activeInstrumentKeys.add(key);
			if (!instrumentMaster.symbolForKey(key)) keyToSymbol.set(key, stock.stockName);
		}

		return [...activeInstrumentKeys];
	},

	getActiveKeys() {
		return [...activeInstrumentKeys];
	},

	addSymbol(symbol, instrumentKey) {
		const key = resolveKey(symbol, instrumentKey);
		if (!key || activeInstrumentKeys.has(key)) return;
		activeInstrumentKeys.add(key);
		if (!instrumentMaster.symbolForKey(key)) keyToSymbol.set(key, symbol);
		onChangeCallback?.([key]);
	},

	symbolForKey(instrumentKey) {
		return keyToSymbol.get(instrumentKey) ?? instrumentMaster.symbolForKey(instrumentKey) ?? instrumentKey;
	},

	keyForSymbol(symbol) {
		return instrumentMaster.keyForSymbol(symbol);
	},

	resolveKey,

	onSubscriptionChange(callback) {
		onChangeCallback = callback;
	},
};
