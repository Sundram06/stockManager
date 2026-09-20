// Deciding whether a trade in a file is one the ledger already has.
//
// Today's rule is exact: same timestamp, quantity and price, or the same
// externalTradeId. That is right for a VittNest backup, where both sides came
// from the same database and match to the millisecond.
//
// Broker files will need a looser rule, because a trade typed in by hand is
// stored at midnight with a rounded price while the broker records the real
// time and the exact fill: match on the calendar day, group the broker's fills
// by order id, and allow a small price difference. That belongs here, next to
// the exact rule, not inside the planner.

export const tradeKey = (date, quantity, price) => `${new Date(date).getTime()}|${quantity}|${price}`;

/**
 * Splits file trades into ones the ledger already has and new ones. Matching is
 * a multiset: two identical buys in the file against one stored buy means one
 * of them is new.
 *
 * @param {Array} fileTrades  CanonicalTrade[] for one stock and one side
 * @param {Array} storedRows  the stored lots or sell events for that stock
 * @param {Function} storedKey  builds a tradeKey from a stored row
 */
export function dedupe(fileTrades, storedRows, storedKey) {
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
	return { fresh, duplicates };
}
