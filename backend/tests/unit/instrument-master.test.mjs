import { afterEach, describe, expect, it } from "vitest";
import { instrumentMaster, toEquityList } from "../../src/services/instrument-master.service.mjs";
import { subscriptionService } from "../../src/services/subscription.service.mjs";

const OLD_KEY = "NSE_EQ|INE814H01011";
const NEW_KEY = "NSE_EQ|INE814H01029";

const current = [{ trading_symbol: "ADANIPOWER", instrument_key: NEW_KEY, isin: "INE814H01029", exchange: "NSE" }];
const snapshot = [{ trading_symbol: "ADANIPOWER", instrument_key: OLD_KEY, isin: "INE814H01011", exchange: "NSE" }];

afterEach(() => instrumentMaster.use(snapshot, "bundled"));

describe("instrument list", () => {
	it("keeps only cash equity from Upstox's full exchange file", () => {
		const list = toEquityList([
			{ segment: "NSE_EQ", trading_symbol: "ADANIPOWER", instrument_key: NEW_KEY, isin: "INE814H01029", name: "ADANI POWER LTD" },
			{ segment: "NSE_FO", trading_symbol: "ADANIPOWER25OCTFUT", instrument_key: "NSE_FO|123" },
			{ segment: "NSE_INDEX", trading_symbol: "NIFTY 50", instrument_key: "NSE_INDEX|Nifty 50" },
		]);

		expect(list).toEqual([
			{ trading_symbol: "ADANIPOWER", instrument_key: NEW_KEY, isin: "INE814H01029", name: "ADANI POWER LTD", exchange: "NSE" },
		]);
	});
});

describe("choosing the key to price a stock with", () => {
	it("uses Upstox's current key for a symbol with nothing stored", () => {
		instrumentMaster.use(current, "upstox");
		expect(subscriptionService.resolveKey("ADANIPOWER", undefined)).toBe(NEW_KEY);
	});

	it("replaces a stored key that Upstox no longer prices", () => {
		instrumentMaster.use(current, "upstox");
		expect(subscriptionService.resolveKey("ADANIPOWER", OLD_KEY)).toBe(NEW_KEY);
	});

	it("keeps a stored key that is still current", () => {
		instrumentMaster.use(current, "upstox");
		expect(subscriptionService.resolveKey("ADANIPOWER", NEW_KEY)).toBe(NEW_KEY);
	});

	it("keeps the stored key when only the bundled snapshot is available", () => {
		// The snapshot is older than most stored keys, so it must not overrule them.
		instrumentMaster.use(snapshot, "bundled");
		expect(subscriptionService.resolveKey("ADANIPOWER", NEW_KEY)).toBe(NEW_KEY);
	});

	it("keeps an unknown stored key rather than dropping the stock", () => {
		instrumentMaster.use(current, "upstox");
		expect(subscriptionService.resolveKey("SOMEDELISTED", "NSE_EQ|INE000000000")).toBe("NSE_EQ|INE000000000");
	});
});
