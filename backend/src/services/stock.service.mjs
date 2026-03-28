import mongoose from "mongoose";
import { History, Stock } from "../models/index.mjs";

export const createStockForUser = async (userId, stockInput) => {
	const newStock = { ...stockInput, userId };
	const stock = new Stock(newStock);
	const historyPayload = {
		...newStock,
		stockId: stock._id,
		userId,
	};

	const history = new History(historyPayload);
	await stock.save();
	await history.save();
	return historyPayload;
};

export const listStocksForUser = async (userId) => {
	const userObjectId = new mongoose.Types.ObjectId(userId);
	const stocks = await Stock.find({ userId: userObjectId });
	const stocksList = [];

	for (const stock of stocks) {
		const historyRows = await History.find({ stockId: stock._id }).sort({ date: 1 });

		let totalRemainingQty = 0;
		let totalRemainingCost = 0;

		for (const row of historyRows) {
			const quantitySold = row.quantitySold || 0;
			const remainingQty = row.quantity - quantitySold;
			if (remainingQty > 0) {
				totalRemainingQty += remainingQty;
				totalRemainingCost += remainingQty * row.avgPrice;
			}
		}

		const isDormant = totalRemainingQty === 0;
		const avgPrice = isDormant
			? 0
			: Number((totalRemainingCost / totalRemainingQty).toFixed(2));
		const totalCostOfStock = isDormant
			? 0
			: parseFloat((totalRemainingQty * avgPrice).toFixed(2));
		const currVal = isDormant ? 0 : 20;
		const quantity = isDormant ? 0 : totalRemainingQty;

		stocksList.push({
			...stock.toObject(),
			quantity,
			avgPrice,
			totalCostOfStock,
			ltp: 20,
			currVal,
			pnl: 20,
			netChange: 20,
			dayChange: 20,
		});
	}

	return stocksList;
};

export const deleteAllStocks = async (userId) => {
	const stocks = await Stock.find({ userId }).select("_id");
	const stockIds = stocks.map((stock) => stock._id);

	await Stock.deleteMany({ userId });
	await History.deleteMany({ stockId: { $in: stockIds } });
};


export const deleteStockById = async (userId, stockId) => {
	await Stock.findOneAndDelete({ _id: stockId, userId });
	await History.deleteMany({ stockId });
};
