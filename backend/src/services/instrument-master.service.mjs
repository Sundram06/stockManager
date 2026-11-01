import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import fetch from "node-fetch";
import { logError, logInfo } from "../utils/logger.mjs";

// The list that turns a trading symbol into the instrument key Upstox prices.
//
// Keys change when a company splits its shares or changes its face value: the
// ISIN changes, so the old key stops returning prices. The bundled
// instruments.json is a snapshot and goes stale, so the live list is fetched
// from Upstox at startup and once a day. The bundled file is only the fallback
// for when that download fails.

const MASTER_URL = "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz";
const REFRESH_MS = 24 * 60 * 60 * 1000;
const DOWNLOAD_TIMEOUT_MS = 20_000;

const BUNDLED_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../assets/instruments.json");

let instruments = [];
let bySymbol = new Map();
let byKey = new Map();
let source = "none";
let loadedAt = null;

function use(list, from) {
	instruments = list;
	bySymbol = new Map(list.map((i) => [i.trading_symbol, i]));
	byKey = new Map(list.map((i) => [i.instrument_key, i]));
	source = from;
	loadedAt = new Date();
}

/** Upstox's full NSE file holds every segment; only cash equity is wanted. */
export function toEquityList(rows) {
	return rows
		.filter((r) => r.segment === "NSE_EQ" && r.trading_symbol && r.instrument_key)
		.map((r) => ({
			trading_symbol: r.trading_symbol,
			instrument_key: r.instrument_key,
			isin: r.isin,
			name: r.name,
			exchange: "NSE",
		}));
}

export function loadBundled() {
	try {
		use(JSON.parse(fs.readFileSync(BUNDLED_PATH, "utf8")), "bundled");
	} catch (err) {
		logError("Bundled instrument list could not be read", { error: err.message });
	}
}

/** Replaces the list with Upstox's current one. Keeps the old list on any failure. */
export async function refreshFromUpstox() {
	try {
		const res = await fetch(MASTER_URL, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const rows = JSON.parse(zlib.gunzipSync(Buffer.from(await res.arrayBuffer())).toString("utf8"));
		const list = toEquityList(rows);
		if (list.length < 1000) throw new Error(`only ${list.length} equity instruments in the download`);
		use(list, "upstox");
		logInfo("Instrument list refreshed from Upstox", { instruments: list.length });
		return true;
	} catch (err) {
		logError("Instrument list refresh failed; using the current list", { error: err.message, source });
		return false;
	}
}

export function startDailyRefresh() {
	setInterval(refreshFromUpstox, REFRESH_MS).unref();
}

export const instrumentMaster = {
	keyForSymbol: (symbol) => bySymbol.get(symbol)?.instrument_key ?? null,
	symbolForKey: (key) => byKey.get(key)?.trading_symbol ?? null,
	hasKey: (key) => byKey.has(key),
	all: () => instruments,
	status: () => ({ source, loadedAt, instruments: instruments.length }),
	// Lets tests install a known list without touching the network.
	use,
};

loadBundled();
