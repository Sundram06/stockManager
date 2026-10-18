export function groupHistoryByStockId(historyRows = []) {
	const map = {};
	historyRows.forEach((row) => {
		if (!map[row.stockId]) {
			map[row.stockId] = [];
		}
		map[row.stockId].push(row);
	});
	return map;
}

export function computeDormantMetrics(stockHistory = []) {
	let totalSoldQty = 0;
	let totalSoldCost = 0;
	let totalSellValue = 0;
	let totalPnl = 0;

	stockHistory.forEach((row) => {
		if (row.quantitySold && row.quantitySold > 0) {
			totalSoldQty += row.quantitySold;
			totalSoldCost += row.quantitySold * row.avgPrice;
			totalSellValue += row.quantitySold * (row.sellingPrice || 0);
			totalPnl += row.pnl || 0;
		}
	});

	return {
		totalSoldQty,
		totalSoldCost,
		totalSellValue,
		totalPnl,
		avgBuyPrice: totalSoldQty > 0 ? totalSoldCost / totalSoldQty : 0,
		avgSellPrice: totalSoldQty > 0 ? totalSellValue / totalSoldQty : 0,
	};
}

export function computeActiveStockMetrics(stocks = [], historyByStockId = {}) {
	const metrics = {};

	stocks.forEach((stock) => {
		if (stock.quantity > 0) {
			const stockHistory = historyByStockId[stock._id] || [];
			let totalQty = 0;
			let totalCost = 0;

			stockHistory.forEach((row) => {
				const unsoldQty = (row.quantity || 0) - (row.quantitySold || 0);
				if (unsoldQty > 0) {
					totalQty += unsoldQty;
					totalCost += unsoldQty * (row.avgPrice || 0);
				}
			});

			metrics[stock._id] = {
				totalInvested: totalCost,
				avgPrice: totalQty > 0 ? totalCost / totalQty : stock.avgPrice,
			};
		}
	});

	return metrics;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * What one holding is worth right now. Returns nulls when no live price has
 * arrived, so callers show a placeholder rather than a stale or zero figure.
 *
 * Every screen that shows P&L for a stock goes through here. Writing the same
 * arithmetic per screen is how the mobile and desktop rows came to round
 * differently.
 */
export function liveStockMetrics({ quantity = 0, avgPrice = 0, totalInvested = 0, live } = {}) {
	const ltp = live?.ltp ?? null;
	const cp = live?.cp ?? null;
	const hasPrice = typeof ltp === "number" && Number.isFinite(ltp);

	const currentValue = hasPrice && quantity > 0 ? round2(quantity * ltp) : null;
	const pnl = hasPrice ? round2((ltp - avgPrice) * quantity) : null;
	const pnlPct = hasPrice && avgPrice > 0 ? ((ltp - avgPrice) / avgPrice) * 100 : null;
	const dayChange = hasPrice && typeof cp === "number" ? round2((ltp - cp) * quantity) : null;
	const dayChangePct = hasPrice && typeof cp === "number" && cp > 0 ? ((ltp - cp) / cp) * 100 : null;

	return { ltp, cp, quantity, avgPrice, totalInvested, currentValue, pnl, pnlPct, dayChange, dayChangePct };
}

/** Today's move in the share price itself, independent of how many are held. */
export function priceDayChange(live) {
	const ltp = live?.ltp ?? null;
	const cp = live?.cp ?? null;
	if (typeof ltp !== "number" || typeof cp !== "number") return { change: null, pct: null };
	return { change: round2(ltp - cp), pct: cp > 0 ? ((ltp - cp) / cp) * 100 : null };
}

/**
 * The same figures for the whole portfolio, plus the best and worst holding by
 * percentage. `hasLiveData` is false until at least one price has arrived.
 */
export function portfolioTotals({ stocks = [], activeStockMetrics = {}, ltpMap = {} } = {}) {
	let totalInvested = 0;
	let currentValue = 0;
	let dayChange = 0;
	let hasLiveData = false;
	let best = null;
	let worst = null;

	for (const stock of stocks) {
		if (!(stock.quantity > 0)) continue;

		const metrics = activeStockMetrics[stock._id];
		const per = liveStockMetrics({
			quantity: stock.quantity,
			avgPrice: metrics?.avgPrice ?? stock.avgPrice,
			totalInvested: metrics?.totalInvested ?? 0,
			live: ltpMap[stock.stockName],
		});

		totalInvested += per.totalInvested;
		if (per.currentValue === null) continue;

		hasLiveData = true;
		currentValue += per.currentValue;
		dayChange += per.dayChange ?? 0;

		if (per.pnlPct === null) continue;
		const entry = { name: stock.stockName, pct: per.pnlPct, pnl: per.pnl };
		if (!best || per.pnlPct > best.pct) best = entry;
		if (!worst || per.pnlPct < worst.pct) worst = entry;
	}

	const unrealizedPnl = hasLiveData ? round2(currentValue - totalInvested) : null;

	return {
		totalInvested: round2(totalInvested),
		currentValue: hasLiveData ? round2(currentValue) : null,
		unrealizedPnl,
		unrealizedPct: hasLiveData && totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : null,
		dayChange: hasLiveData ? round2(dayChange) : null,
		best,
		worst,
		hasLiveData,
	};
}
