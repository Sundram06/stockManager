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
