import mongoose from "mongoose";
import { History, Stock } from "../models/index.mjs";
import { toDateOrNow } from "../utils/date.mjs";
import { addLotAndRebuild, recordSell, withTransaction } from "./ledger.service.mjs";
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

	// Save the lot and replay the stock's ledger in one transaction. With sells
	// present, a backdated lot moves FIFO allocations; without sells the replay
	// just refreshes quantity and avgPrice.
	const saved = await addLotAndRebuild(stock, history);
	if (saved.error) return saved;

	return { history, stock };
};

export const sellHistory = async (userId, { quantity, avgPrice, date, stockId }) => {
	const quantityToSell = Number(quantity);
	const sellingPrice = Number(avgPrice);
	// A date that was supplied but can't be parsed must not silently become
	// "now" — that is how a sale can end up dated before its own purchase.
	if (date != null && date !== "" && Number.isNaN(new Date(date).getTime())) {
		return { error: "Sale date is not a valid date", statusCode: 400 };
	}
	const dateSold = toDateOrNow(date);

	const tradingCheck = await checkTradingDate(dateSold);
	if (!tradingCheck.allowed) {
		return { error: tradingCheck.reason, statusCode: 400 };
	}

	const stock = await Stock.findOne({ _id: stockId, userId });
	if (!stock) {
		return { error: "Stock not found", statusCode: 404 };
	}

	// Validate and write in one transaction: a sell that cannot be filled is
	// rejected before any row is touched (the old path saved lots one by one
	// and could leave a half-applied sell behind on failure).
	return withTransaction((session) =>
		recordSell({
			stock,
			userId,
			date: dateSold,
			quantity: quantityToSell,
			price: sellingPrice,
			session,
		}),
	);
};
