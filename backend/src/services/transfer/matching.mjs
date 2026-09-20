// Matching is exact: same timestamp, quantity and price, or the same
// externalTradeId. That works for a VittNest backup, where both sides of the
// comparison came from this database. Broker files need day-level matching
// with a price tolerance, and that rule belongs in this file.

export const tradeKey = (date, quantity, price) => `${new Date(date).getTime()}|${quantity}|${price}`;

/**
 * Splits file trades into ones the ledger already has and new ones. Counts
 * matter: two identical buys in the file against one stored buy means one of
 * them is still new.
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
