import mongoose from "mongoose";
import { History, Stock } from "../models/index.mjs";
import { toDateOrNow } from "../utils/date.mjs";
import { applyFifoSell } from "../utils/fifo-sell.mjs";
import { recalculateFifoForStock } from "./fifo-recalc.service.mjs";
import { checkTradingDate } from "./market-calendar.service.mjs";

export const listHistory = async () => {
	return History.find();
};

export const listHistoryForUser = async (userId) => {
	const stocks = await Stock.find({ userId }).select("_id");
	const stockIds = stocks.map((stock) => stock._id);
	return History.find({ stockId: { $in: stockIds } });
};

export const createHistory = async (userId, newHistory) => {
	const tradingCheck = await checkTradingDate(newHistory.date || new Date());
	if (!tradingCheck.allowed) {
		return { error: tradingCheck.reason, statusCode: 400 };
	}

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

	// If any sell occurred on or after the new lot's date, FIFO assignments
	// on later lots are now wrong — recalculate from scratch.
	const lotDate = history.date instanceof Date ? history.date : new Date(history.date);
	const affectedSell = await History.findOne({
		stockId: stock._id,
		quantitySold: { $gt: 0 },
		dateSold: { $gte: lotDate },
		_id: { $ne: history._id },
	});

	if (affectedSell) {
		await recalculateFifoForStock(stock._id, stock);
	}

	return { history, stock };
};

export const sellHistory = async (userId, { quantity, avgPrice, date, stockId }) => {
	const quantityToSell = Number(quantity);
	const sellingPrice = Number(avgPrice);
	const dateSold = toDateOrNow(date);

	const tradingCheck = await checkTradingDate(dateSold);
	if (!tradingCheck.allowed) {
		return { error: tradingCheck.reason, statusCode: 400 };
	}

	const stock = await Stock.findOne({ _id: stockId, userId });
	if (!stock) {
		return { error: "Stock not found", statusCode: 404 };
	}

	const fifoRows = await History.find({
		stockId: stock._id,
		date: { $lte: dateSold },
		$expr: { $gt: ["$quantity", { $ifNull: ["$quantitySold", 0] }] },
	}).sort({ date: 1, _id: 1 });

	return applyFifoSell({
		fifoRows,
		quantityToSell,
		sellingPrice,
		dateSold,
	});
};
