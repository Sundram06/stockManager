import { Stock } from "../db/model.mjs";

export const addStockInDB = async (stockData) => {
	const newStock = stockData;
	console.log("stock util function");
	console.log(newStock);

	let ltp, currVal, pnl, netChange, dayChange;
	newStock.ltp = 20;
	newStock.currVal = 20;
	newStock.pnl = 20;
	newStock.netChange = 20;
	newStock.dayChange = 20;
	newStock.totalCostOfStock = totalCostOfStock;

	const stock = new Stock(newStock);
	const history = new History(newStock);
	await stock.save();
	await history.save();
	console.log("posted", newStock);
	return stock;
};
