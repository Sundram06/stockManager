/** Works out the sale's profit both ways, so the numbers shown always follow the trades. */
export function compareMethods(trades) {
	const buys = trades.filter((t) => t.side === "Buy");
	const sell = trades.find((t) => t.side === "Sell");
	const boughtQty = buys.reduce((sum, b) => sum + b.quantity, 0);
	const boughtCost = buys.reduce((sum, b) => sum + b.quantity * b.price, 0);
	const heldQty = boughtQty - sell.quantity;
	const proceeds = sell.quantity * sell.price;

	const averageCost = boughtCost / boughtQty;
	const average = { soldCost: averageCost * sell.quantity, heldCost: averageCost };

	let toSell = sell.quantity;
	let soldCost = 0;
	for (const buy of buys) {
		const taken = Math.min(toSell, buy.quantity);
		soldCost += taken * buy.price;
		toSell -= taken;
	}
	const fifo = { soldCost, heldCost: (boughtCost - soldCost) / heldQty };

	return {
		soldQty: sell.quantity,
		average: { ...average, profit: proceeds - average.soldCost },
		fifo: { ...fifo, profit: proceeds - fifo.soldCost },
	};
}
