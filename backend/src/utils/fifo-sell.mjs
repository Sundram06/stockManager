export const applyFifoSell = async ({ fifoRows, quantityToSell, sellingPrice, dateSold }) => {
	let remainingToSell = quantityToSell;
	let totalPnl = 0;
	const updatedRows = [];

	if (!fifoRows.length) {
		return { error: "No stock to sell", statusCode: 400 };
	}

	for (const row of fifoRows) {
		if (remainingToSell <= 0) {
			break;
		}

		const alreadySold = row.quantitySold || 0;
		const available = row.quantity - alreadySold;
		const sellQty = Math.min(remainingToSell, available);
		const pnl = parseFloat((sellQty * (sellingPrice - row.avgPrice)).toFixed(2));

		totalPnl += pnl;
		const prevTotalSellValue = (row.sellingPrice || 0) * alreadySold;
		const newTotalSellValue = prevTotalSellValue + sellingPrice * sellQty;
		const newQtySold = alreadySold + sellQty;
		const newAvgSellingPrice = newTotalSellValue / newQtySold;

		row.quantitySold = newQtySold;
		row.sellingPrice = newAvgSellingPrice;
		row.dateSold = dateSold;
		row.pnl = parseFloat(((row.pnl || 0) + pnl).toFixed(2));

		await row.save();
		updatedRows.push(row);
		remainingToSell -= sellQty;
	}

	if (remainingToSell > 0) {
		return { error: "Not enough stock to sell", statusCode: 400 };
	}

	return {
		message: "Stock sold using FIFO",
		totalPnl,
		updatedRows,
	};
};
