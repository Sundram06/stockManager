// Groups consecutive FIFO rows that share the same purchase date.
// Same-day lots are treated as a single pool and consumed proportionally.
function groupRowsByDate(rows) {
	const groups = [];
	let currentDateStr = null;
	let currentGroup = [];

	for (const row of rows) {
		const d = row.date instanceof Date ? row.date : new Date(row.date);
		const rowDateStr = isNaN(d.getTime()) ? "__no_date__" : d.toISOString().split("T")[0];

		if (rowDateStr !== currentDateStr) {
			if (currentGroup.length > 0) groups.push(currentGroup);
			currentDateStr = rowDateStr;
			currentGroup = [row];
		} else {
			currentGroup.push(row);
		}
	}
	if (currentGroup.length > 0) groups.push(currentGroup);
	return groups;
}

export const applyFifoSell = async ({ fifoRows, quantityToSell, sellingPrice, dateSold }) => {
	let remainingToSell = quantityToSell;
	let totalPnl = 0;
	const updatedRows = [];

	if (!fifoRows.length) {
		return { error: "No stock to sell", statusCode: 400 };
	}

	const dateGroups = groupRowsByDate(fifoRows);

	for (const group of dateGroups) {
		if (remainingToSell <= 0) break;

		// Only consider lots with remaining shares
		const activeLots = group.filter(
			(row) => row.quantity - (row.quantitySold || 0) > 0
		);
		if (activeLots.length === 0) continue;

		const totalGroupAvailable = activeLots.reduce(
			(sum, row) => sum + row.quantity - (row.quantitySold || 0),
			0
		);

		const toSellFromGroup = Math.min(remainingToSell, totalGroupAvailable);
		let allocated = 0;

		for (let i = 0; i < activeLots.length; i++) {
			const row = activeLots[i];
			const available = row.quantity - (row.quantitySold || 0);

			// Last active lot in the group absorbs any rounding remainder
			const sellQty =
				i === activeLots.length - 1
					? toSellFromGroup - allocated
					: Math.round(toSellFromGroup * (available / totalGroupAvailable));

			if (sellQty <= 0) continue;

			const pnl = parseFloat((sellQty * (sellingPrice - row.avgPrice)).toFixed(2));
			totalPnl += pnl;

			const prevTotalSellValue = (row.sellingPrice || 0) * (row.quantitySold || 0);
			const newQtySold = (row.quantitySold || 0) + sellQty;
			const newAvgSellingPrice = (prevTotalSellValue + sellingPrice * sellQty) / newQtySold;

			row.quantitySold = newQtySold;
			row.sellingPrice = newAvgSellingPrice;
			row.dateSold = dateSold;
			row.pnl = parseFloat(((row.pnl || 0) + pnl).toFixed(2));

			await row.save();
			updatedRows.push(row);
			allocated += sellQty;
		}

		remainingToSell -= toSellFromGroup;
	}

	if (remainingToSell > 0) {
		return { error: "Not enough stock to sell", statusCode: 400 };
	}

	return { message: "Stock sold using FIFO", totalPnl, updatedRows };
};
