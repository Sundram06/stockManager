import mongoose from "mongoose";
import { History, Stock } from "../models/index.mjs";
import { toDateOrNow } from "../utils/date.mjs";
import { applyFifoSell } from "../utils/fifo-sell.mjs";

export const listHistory = async () => {
	return History.find();
};

export const listHistoryForUser = async (userId) => {
	const stocks = await Stock.find({ userId }).select("_id");
	const stockIds = stocks.map((stock) => stock._id);
	return History.find({ stockId: { $in: stockIds } });
};

export const createHistory = async (userId, newHistory) => {
	const history = new History({
		stockId: new mongoose.Types.ObjectId(newHistory.stockId),
		userId: new mongoose.Types.ObjectId(userId),
		...newHistory,
	});

	const stock = await Stock.findOne({ _id: history.stockId, userId });
	if (!stock) {
		return { error: "Stock not found", statusCode: 404 };
	}
	const activeHistoryRows = await History.find({
		stockId: stock._id,
		$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
	});

	let totalActiveQty = 0;
	let totalActiveCost = 0;

	activeHistoryRows.forEach((row) => {
		const unsoldQty = row.quantity - (row.quantitySold || 0);
		totalActiveQty += unsoldQty;
		totalActiveCost += unsoldQty * row.avgPrice;
	});

	totalActiveQty += history.quantity;
	totalActiveCost += history.quantity * history.avgPrice;

	stock.quantity = totalActiveQty < 0 ? 0 : totalActiveQty;
	stock.avgPrice = Number((totalActiveCost / totalActiveQty).toFixed(2));

	await Promise.all([stock.save(), history.save()]);
	return { history, stock };
};

export const sellHistory = async (userId, { quantity, avgPrice, date, stockId }) => {
	const quantityToSell = Number(quantity);
	const sellingPrice = Number(avgPrice);
	const dateSold = toDateOrNow(date);

	const stock = await Stock.findOne({ _id: stockId, userId });
	if (!stock) {
		return { error: "Stock not found", statusCode: 404 };
	}

	const fifoRows = await History.find({
		stockId: stock._id,
		$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
	}).sort({ date: 1 });

	return applyFifoSell({
		fifoRows,
		quantityToSell,
		sellingPrice,
		dateSold,
	});
};
