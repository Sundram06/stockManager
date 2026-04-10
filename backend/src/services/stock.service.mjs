import mongoose from "mongoose";
import { History, Stock } from "../models/index.mjs";
import { subscriptionService } from "./subscription.service.mjs";
import { recalculateFifoForStock } from "./fifo-recalc.service.mjs";
import { checkTradingDate } from "./market-calendar.service.mjs";

// ─── createStockForUser ───────────────────────────────────────────────────────

export const createStockForUser = async (userId, stockInput) => {
	const tradingCheck = await checkTradingDate(stockInput.date || new Date());
	if (!tradingCheck.allowed) {
		return { error: tradingCheck.reason, statusCode: 400 };
	}

	const existingStock = await Stock.findOne({ userId, stockName: stockInput.stockName });

	if (existingStock) {
		// ── Stock exists: add a new history lot ──────────────────────────────
		const history = new History({
			stockId: existingStock._id,
			userId,
			stockName: stockInput.stockName,
			quantity: stockInput.quantity,
			avgPrice: stockInput.avgPrice,
			date: stockInput.date,
			...(stockInput.instrumentKey && { instrumentKey: stockInput.instrumentKey }),
		});

		// Optimistic qty/avgPrice update (may be overridden by recalc below)
		const activeHistoryRows = await History.find({
			stockId: existingStock._id,
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

		existingStock.quantity = totalActiveQty < 0 ? 0 : totalActiveQty;
		existingStock.avgPrice = Number((totalActiveCost / totalActiveQty).toFixed(2));

		await Promise.all([existingStock.save(), history.save()]);

		// ── Backdated recalculation ───────────────────────────────────────────
		// If any sell transaction occurred on or after the new lot's date,
		// those FIFO assignments are now wrong — recalculate from scratch.
		const lotDate = new Date(stockInput.date);
		const affectedSell = await History.findOne({
			stockId: existingStock._id,
			quantitySold: { $gt: 0 },
			dateSold: { $gte: lotDate },
			_id: { $ne: history._id },
		});

		if (affectedSell) {
			await recalculateFifoForStock(existingStock._id, existingStock);
		}

		if (stockInput.instrumentKey) {
			subscriptionService.addSymbol(stockInput.stockName, stockInput.instrumentKey);
		}
		return { history: history.toObject(), stock: existingStock.toObject() };
	}

	// ── New stock: create stock + first history lot ───────────────────────────
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
	subscriptionService.addSymbol(stockInput.stockName, stockInput.instrumentKey);
	return historyPayload;
};

// ─── Other exports (unchanged) ────────────────────────────────────────────────

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
		const quantity = isDormant ? 0 : totalRemainingQty;

		stocksList.push({
			...stock.toObject(),
			quantity,
			avgPrice,
			totalCostOfStock,
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
