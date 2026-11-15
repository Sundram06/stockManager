import mongoose from "mongoose";
import { History, SellEvent, Stock } from "../models/index.mjs";
import { subscriptionService } from "./subscription.service.mjs";
import { portfolioEvents } from "./portfolio-events.mjs";
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
		portfolioEvents.holdingsChanged(userId);
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
	await withTransaction(async (session) => {
		await stock.save({ session });
		await history.save({ session });
	});
	subscriptionService.addSymbol(stockInput.stockName, stockInput.instrumentKey);
	portfolioEvents.holdingsChanged(userId);
	return historyPayload;
};

// ─── Other exports (unchanged) ────────────────────────────────────────────────

/** Symbols the user currently holds (quantity above zero). */
export const listHeldSymbols = async (userId) =>
	Stock.distinct("stockName", { userId: new mongoose.Types.ObjectId(userId), quantity: { $gt: 0 } });

/** Remaining quantity, weighted average cost and total cost of a stock's unsold lots. */
const summariseOpenLots = (lots) => {
	let remainingQty = 0;
	let remainingCost = 0;
	for (const lot of lots) {
		const unsold = lot.quantity - (lot.quantitySold || 0);
		if (unsold > 0) {
			remainingQty += unsold;
			remainingCost += unsold * lot.avgPrice;
		}
	}
	if (remainingQty === 0) return { quantity: 0, avgPrice: 0, totalCostOfStock: 0 };

	const avgPrice = Number((remainingCost / remainingQty).toFixed(2));
	return { quantity: remainingQty, avgPrice, totalCostOfStock: parseFloat((remainingQty * avgPrice).toFixed(2)) };
};

// Two queries whatever the portfolio size: every lot of the user's stocks is
// loaded at once and grouped here, instead of one round trip per stock.
export const listStocksForUser = async (userId) => {
	const stocks = await Stock.find({ userId: new mongoose.Types.ObjectId(userId) });
	if (stocks.length === 0) return [];

	const lots = await History.find({ stockId: { $in: stocks.map((stock) => stock._id) } })
		.select("stockId quantity quantitySold avgPrice")
		// Same order the per-stock queries used, so the floating-point sums match.
		.sort({ stockId: 1, date: 1, _id: 1 })
		.lean();
	const lotsByStock = new Map();
	for (const lot of lots) {
		const key = String(lot.stockId);
		if (!lotsByStock.has(key)) lotsByStock.set(key, []);
		lotsByStock.get(key).push(lot);
	}

	return stocks.map((stock) => ({
		...stock.toObject(),
		...summariseOpenLots(lotsByStock.get(String(stock._id)) ?? []),
	}));
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
