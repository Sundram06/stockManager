// Deciding whether a trade in a file is one the ledger already has.
//
// Two rules, picked by the parser:
//
// "exact"  a VittNest backup. Both sides came from this database, so the
//          timestamp, quantity and price match to the millisecond.
//
// "day"    a broker tradebook. The same trade typed in by hand sits at
//          midnight with a rounded price, while the broker records the real
//          fill time and may split one order into several fills. Matching is
//          therefore per calendar day, with the broker's fills grouped and the
//          price allowed to differ slightly.

const PRICE_TOLERANCE = 0.01;

export const tradeKey = (date, quantity, price) => `${new Date(date).getTime()}|${quantity}|${price}`;

const dayOf = (date) => new Date(date).toISOString().slice(0, 10);
const round2 = (n) => Math.round(n * 100) / 100;

const withinTolerance = (a, b) => {
	const scale = Math.max(Math.abs(a), Math.abs(b), 1);
	return Math.abs(a - b) / scale <= PRICE_TOLERANCE;
};

function exactDedupe(fileTrades, storedRows, storedKey) {
	const counts = new Map();
	const storedIds = new Set();
	for (const row of storedRows) {
		const key = storedKey(row);
		counts.set(key, (counts.get(key) ?? 0) + 1);
		if (row.externalTradeId) storedIds.add(row.externalTradeId);
	}

	const fresh = [];
	let duplicates = 0;
	for (const t of fileTrades) {
		if (t.externalTradeId && storedIds.has(t.externalTradeId)) {
			duplicates += 1;
			continue;
		}
		const key = tradeKey(t.date, t.quantity, t.price);
		const n = counts.get(key) ?? 0;
		if (n > 0) {
			counts.set(key, n - 1);
			duplicates += 1;
		} else {
			fresh.push(t);
		}
	}
	return { fresh, duplicates, matched: [] };
}

/**
 * The broker's fills for one order are one trade as far as the user is
 * concerned: they typed "bought 100", the file says 60 + 25 + 15. Group them so
 * the quantities can be compared, keeping the individual fills for writing.
 */
function groupFills(trades) {
	const groups = new Map();
	for (const trade of trades) {
		const key = [dayOf(trade.date), trade.externalOrderId || `${trade.stockName}|${trade.side}`].join("|");
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(trade);
	}

	return [...groups.values()].map((fills) => {
		const quantity = fills.reduce((sum, f) => sum + f.quantity, 0);
		const value = fills.reduce((sum, f) => sum + f.quantity * f.price, 0);
		return { fills, quantity, price: round2(value / quantity), day: dayOf(fills[0].date) };
	});
}

/**
 * Pairs broker groups against stored rows on the same day. A group matches when
 * one stored row has the same quantity and a price within tolerance. Several
 * candidates on the same day mean the pairing is a guess, so nothing is
 * matched and the trades are treated as new for the preview to resolve.
 */
function dayDedupe(fileTrades, storedRows, storedPrice) {
	const byDay = new Map();
	for (const row of storedRows) {
		const day = dayOf(row.date);
		if (!byDay.has(day)) byDay.set(day, []);
		byDay.get(day).push(row);
	}

	const used = new Set();
	const storedIds = new Set(storedRows.filter((r) => r.externalTradeId).map((r) => r.externalTradeId));

	const fresh = [];
	const matched = [];
	let duplicates = 0;

	for (const group of groupFills(fileTrades)) {
		// A matched group is stored under one of its fill ids, so recognising
		// any one of them means the whole order is already in.
		if (group.fills.some((f) => f.externalTradeId && storedIds.has(f.externalTradeId))) {
			duplicates += group.fills.length;
			continue;
		}

		const candidates = (byDay.get(group.day) ?? []).filter(
			(row) =>
				!used.has(row) &&
				!row.externalTradeId &&
				row.quantity === group.quantity &&
				withinTolerance(storedPrice(row), group.price),
		);

		if (candidates.length === 1) {
			used.add(candidates[0]);
			matched.push({ stored: candidates[0], fills: group.fills, quantity: group.quantity, price: group.price });
			continue;
		}

		fresh.push(...group.fills);
	}

	return { fresh, duplicates, matched };
}

/**
 * Splits file trades into ones the ledger already has, ones that are new, and
 * ones that look like a trade already entered by hand. Counts matter: two
 * identical buys in the file against one stored buy means one of them is
 * still new.
 */
export function dedupe(fileTrades, storedRows, storedKey, { matching = "exact", storedPrice } = {}) {
	if (matching === "day") return dayDedupe(fileTrades, storedRows, storedPrice);
	return exactDedupe(fileTrades, storedRows, storedKey);
}
