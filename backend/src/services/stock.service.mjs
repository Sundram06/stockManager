import mongoose from "mongoose";
import { History, SellEvent, Stock } from "../models/index.mjs";
import { subscriptionService } from "./subscription.service.mjs";
import { addLotAndRebuild, withTransaction } from "./ledger.service.mjs";
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

		// Save the lot and replay the ledger in one transaction. A backdated lot
		// moves FIFO allocations of existing sells; the replay also refreshes
		// quantity and avgPrice.
		const saved = await addLotAndRebuild(existingStock, history);
		if (saved.error) return saved;

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

	await withTransaction(async (session) => {
		await Stock.deleteMany({ userId }, { session });
		await History.deleteMany({ stockId: { $in: stockIds } }, { session });
		await SellEvent.deleteMany({ stockId: { $in: stockIds } }, { session });
	});
};

export const deleteStockById = async (userId, stockId) => {
	await withTransaction(async (session) => {
		const deleted = await Stock.findOneAndDelete({ _id: stockId, userId }, { session });
		// Only remove the ledger if the stock belonged to this user. Previously
		// History was deleted by stockId alone, so a request for someone else's
		// stock id wiped their lots even though the stock itself survived.
		if (!deleted) return;
		await History.deleteMany({ stockId: deleted._id }, { session });
		await SellEvent.deleteMany({ stockId: deleted._id }, { session });
	});
};
