import { FileFormatError, normalizeSymbol } from "../file-format.mjs";
import { parseCsv } from "../../../utils/csv.mjs";

// Reads a tradebook exported from Zerodha Console. The API cannot supply trade
// history, so this file is the only complete source.
//
// Zerodha has reordered and renamed these columns between versions, so the
// parser works from the header names rather than their positions, and accepts
// the names seen so far.

const COLUMNS = {
	symbol: ["symbol", "tradingsymbol", "instrument", "scrip"],
	isin: ["isin"],
	exchange: ["exchange"],
	segment: ["segment"],
	series: ["series"],
	side: ["trade_type", "transaction_type", "type", "buy/sell"],
	quantity: ["quantity", "qty", "traded_quantity"],
	price: ["price", "trade_price", "rate", "average_price"],
	tradeDate: ["trade_date", "date"],
	executedAt: ["order_execution_time", "execution_time", "trade_time", "timestamp"],
	tradeId: ["trade_id", "tradeid"],
	orderId: ["order_id", "orderid"],
	auction: ["auction"],
};

const REQUIRED = ["symbol", "side", "quantity", "price"];

// This app tracks delivery equity only. Anything else in the file is reported
// as skipped rather than silently dropped.
const EQUITY_SEGMENTS = ["eq", "equity", "nse_eq", "bse_eq", "cash"];

const pick = (headers, names) => names.find((name) => headers.includes(name)) ?? null;

const toNumber = (value) => {
	const n = Number(String(value ?? "").replace(/[,\s]/g, ""));
	return Number.isFinite(n) ? n : null;
};

/**
 * Broker timestamps are Indian market time with no zone marker, so they are
 * read as IST. Treating them as the server's local time would shift trades
 * across days on a server running in UTC.
 */
function istDate(value) {
	if (!value) return null;
	const m = String(value)
		.trim()
		.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
	if (!m) return null;
	const [, y, mo, d, hh = "0", mm = "0", ss = "0"] = m;
	const utcMs = Date.UTC(+y, +mo - 1, +d, +hh, +mm, +ss) - 5.5 * 60 * 60 * 1000;
	const date = new Date(utcMs);
	return Number.isNaN(date.getTime()) ? null : date;
}

const sideOf = (value) => {
	const v = String(value ?? "").trim().toLowerCase();
	if (v === "buy" || v === "b") return "BUY";
	if (v === "sell" || v === "s") return "SELL";
	return null;
};

// Recognising the file is looser than parsing it, so a tradebook with a
// column missing reaches parse() and gets told which one, instead of being
// rejected as an unknown file.
export const claims = (content) => {
	const firstLine = String(content).replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
	if (!firstLine.includes(",")) return false;
	const headers = firstLine.split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
	if (!pick(headers, COLUMNS.symbol)) return false;
	const known = ["side", "quantity", "price", "tradeDate", "executedAt", "tradeId"].filter((field) =>
		pick(headers, COLUMNS[field]),
	);
	return known.length >= 2;
};

export function parse(content) {
	const { headers, rows } = parseCsv(content);
	const column = Object.fromEntries(
		Object.entries(COLUMNS).map(([field, names]) => [field, pick(headers, names)]),
	);

	const missing = REQUIRED.filter((field) => !column[field]);
	if (missing.length) {
		throw new FileFormatError(
			`This tradebook is missing the ${missing.join(", ")} column. Download it again from Zerodha Console.`,
		);
	}
	if (!column.tradeDate && !column.executedAt) {
		throw new FileFormatError("This tradebook has no trade date column, so the trades can't be ordered.");
	}

	const trades = [];
	const skipped = { segment: 0, unreadable: 0 };

	rows.forEach((row) => {
		const segment = column.segment ? row[column.segment].toLowerCase() : "";
		if (segment && !EQUITY_SEGMENTS.includes(segment)) {
			skipped.segment += 1;
			return;
		}

		const side = sideOf(row[column.side]);
		const quantity = toNumber(row[column.quantity]);
		const price = toNumber(row[column.price]);
		const date = istDate(column.executedAt && row[column.executedAt]) || istDate(column.tradeDate && row[column.tradeDate]);
		const stockName = normalizeSymbol(row[column.symbol]);

		if (!side || !stockName || !date || !(quantity > 0) || price === null || price < 0) {
			skipped.unreadable += 1;
			return;
		}

		const tradeId = column.tradeId ? row[column.tradeId] : "";
		const day = date.toISOString().slice(0, 10);

		trades.push({
			stockName,
			side,
			date,
			quantity: Math.abs(quantity),
			price,
			source: "ZERODHA",
			// Trade ids repeat across days, so the day is part of the identity.
			...(tradeId && { externalTradeId: `zerodha:${day}:${tradeId}` }),
			...(column.orderId && row[column.orderId] && { externalOrderId: row[column.orderId] }),
			...(column.isin && row[column.isin] && { isin: row[column.isin] }),
			...(column.exchange && row[column.exchange] && { exchange: row[column.exchange].toUpperCase() }),
			// Without an execution time the trade is only known to the day.
			...(!column.executedAt && { isEstimatedDate: true }),
		});
	});

	if (!trades.length) {
		throw new FileFormatError(
			skipped.segment > 0
				? "This tradebook has no equity trades in it. VittNest tracks delivery equity only."
				: "No trades could be read from this tradebook.",
		);
	}

	return { source: "ZERODHA", exportedAt: null, trades, skipped, matching: "day" };
}
