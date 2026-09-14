// Pure FIFO ledger replay. No database, no I/O.
//
// Given every buy lot and every sell event for ONE stock, replays the sells in
// chronological order and returns what each lot and each sell look like
// afterwards. Preview, commit and recalculation all go through this function,
// so what a user is shown is exactly what gets written.
//
// Allocation semantics are deliberately identical to the pre-ledger
// applyFifoSell (see tests/fixtures/legacy-fifo-sell.mjs):
//   - lots are consumed oldest trading day first;
//   - lots bought on the SAME day are pooled and consumed pro-rata, with the
//     last active lot of the day absorbing the rounding remainder;
//   - a sell can only draw on lots dated on or before the sell date.
// Changing these rules changes users' realised P&L, so it is a product
// decision, not a refactor.

const dayKey = (date) => {
	const d = date instanceof Date ? date : new Date(date);
	return Number.isNaN(d.getTime()) ? "__no_date__" : d.toISOString().split("T")[0];
};

const toTime = (date) => {
	const t = (date instanceof Date ? date : new Date(date)).getTime();
	return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
};

const round2 = (n) => parseFloat(n.toFixed(2));

/**
 * @param {object}   input
 * @param {Array<{id: string, date: Date, quantity: number, avgPrice: number}>} input.lots
 *        Buy lots in ledger order (date asc, then insertion order). Order is
 *        significant for same-day lots, so pass them already sorted.
 * @param {Array<{id: string, date: Date, quantity: number, price: number}>} input.sells
 *        Sell events in any order. Ties on the same date keep input order.
 * @returns {{
 *   lots: Array<{id, quantitySold, sellingPrice, dateSold, pnl}>,
 *   sells: Array<{id, allocations: Array<{lotId, quantity, buyPrice, pnl}>, pnl}>,
 *   remainingQuantity: number,
 *   remainingCost: number,
 *   shortfall: null | {sellId, date, requested, filled}
 * }}
 */
export function replayLedger({ lots, sells }) {
	const state = lots.map((lot) => ({
		id: String(lot.id),
		date: lot.date,
		day: dayKey(lot.date),
		time: toTime(lot.date),
		quantity: Number(lot.quantity),
		avgPrice: Number(lot.avgPrice),
		quantitySold: 0,
		sellingPrice: 0,
		dateSold: null,
		pnl: 0,
	}));

	const orderedSells = sells
		.map((sell, seq) => ({ ...sell, seq, time: toTime(sell.date) }))
		.sort((a, b) => a.time - b.time || a.seq - b.seq);

	const sellResults = [];
	let shortfall = null;

	for (const sell of orderedSells) {
		const quantityToSell = Number(sell.quantity);
		const sellingPrice = Number(sell.price);
		let remainingToSell = quantityToSell;
		const allocations = [];

		// Eligible lots: dated on/before the sell, with shares left. Keep ledger
		// order, then group consecutive lots that share a trading day.
		const eligible = state.filter(
			(lot) => lot.time <= sell.time && lot.quantity - lot.quantitySold > 0,
		);
		const groups = [];
		for (const lot of eligible) {
			const last = groups[groups.length - 1];
			if (last && last[0].day === lot.day) last.push(lot);
			else groups.push([lot]);
		}

		for (const group of groups) {
			if (remainingToSell <= 0) break;

			const totalGroupAvailable = group.reduce(
				(sum, lot) => sum + lot.quantity - lot.quantitySold,
				0,
			);
			const toSellFromGroup = Math.min(remainingToSell, totalGroupAvailable);
			let allocated = 0;

			for (let i = 0; i < group.length; i++) {
				const lot = group[i];
				const available = lot.quantity - lot.quantitySold;

				const sellQty =
					i === group.length - 1
						? toSellFromGroup - allocated
						: Math.round(toSellFromGroup * (available / totalGroupAvailable));

				if (sellQty <= 0) continue;

				const pnl = round2(sellQty * (sellingPrice - lot.avgPrice));
				const newQtySold = lot.quantitySold + sellQty;
				lot.sellingPrice =
					(lot.sellingPrice * lot.quantitySold + sellingPrice * sellQty) / newQtySold;
				lot.quantitySold = newQtySold;
				lot.dateSold = sell.date;
				lot.pnl = round2(lot.pnl + pnl);

				allocations.push({ lotId: lot.id, quantity: sellQty, buyPrice: lot.avgPrice, pnl });
				allocated += sellQty;
			}

			remainingToSell -= toSellFromGroup;
		}

		sellResults.push({
			id: sell.id == null ? null : String(sell.id),
			allocations,
			pnl: round2(allocations.reduce((sum, a) => sum + a.pnl, 0)),
		});

		if (remainingToSell > 0) {
			shortfall = {
				sellId: sell.id == null ? null : String(sell.id),
				date: sell.date,
				requested: quantityToSell,
				filled: quantityToSell - remainingToSell,
			};
			break;
		}
	}

	let remainingQuantity = 0;
	let remainingCost = 0;
	for (const lot of state) {
		const unsold = lot.quantity - lot.quantitySold;
		if (unsold > 0) {
			remainingQuantity += unsold;
			remainingCost += unsold * lot.avgPrice;
		}
	}

	return {
		lots: state.map(({ id, quantitySold, sellingPrice, dateSold, pnl }) => ({
			id,
			quantitySold,
			sellingPrice,
			dateSold,
			pnl,
		})),
		sells: sellResults,
		remainingQuantity,
		remainingCost,
		shortfall,
	};
}

/**
 * Rebuilds sell events from the pre-ledger History shape, exactly as the old
 * recalculateFifoForStock did: rows grouped by {dateSold, sellingPrice}. Lossy
 * when one lot was hit by several sells (only the last date and a blended price
 * survive), which is the bug the SellEvent ledger fixes going forward.
 */
export function deriveLegacySellEvents(rows) {
	const byKey = new Map();
	for (const row of rows) {
		if (!(row.quantitySold > 0) || !row.dateSold) continue;
		const dateSold = row.dateSold instanceof Date ? row.dateSold : new Date(row.dateSold);
		const key = `${dateSold.toISOString()}_${row.sellingPrice}`;
		const existing = byKey.get(key);
		if (existing) existing.quantity += row.quantitySold;
		else byKey.set(key, { date: dateSold, price: row.sellingPrice, quantity: row.quantitySold });
	}
	return Array.from(byKey.values()).sort((a, b) => a.date - b.date);
}
