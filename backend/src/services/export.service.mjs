import { randomUUID } from "node:crypto";
import { Stock } from "../models/index.mjs";
import { APP_ID, SCHEMA_VERSION, toCsv } from "../utils/portfolio-file.mjs";
import { loadLedger, replayFor } from "./ledger.service.mjs";
import { marketCache } from "./market-cache.service.mjs";
import { subscriptionService } from "./subscription.service.mjs";

const round2 = (n) => Number(n.toFixed(2));

/**
 * Every stock with its lots and sell events, replayed. Read-only: stocks from
 * before the ledger get their sells derived in memory, nothing is written.
 */
async function loadPortfolio(userId) {
	const stocks = await Stock.find({ userId }).sort({ stockName: 1 });
	const out = [];
	for (const stock of stocks) {
		const { lots, events } = await loadLedger(stock._id);
		out.push({ stock, lots, events, result: replayFor({ lots, events }) });
	}
	return out;
}

const summarise = (result) => ({
	quantity: result.remainingQuantity,
	avgPrice: result.remainingQuantity > 0 ? round2(result.remainingCost / result.remainingQuantity) : 0,
	realisedPnl: round2(result.sells.reduce((sum, s) => sum + s.pnl, 0)),
});

/**
 * The VittNest backup. Holds the facts (each buy lot, each sale) with full
 * timestamps so a restore replays to the same numbers. Allocations and
 * summaries are included for people reading the file; import ignores them and
 * recomputes. No user ids or database ids leave the server.
 */
export async function buildBackup(userId) {
	const portfolio = await loadPortfolio(userId);

	return {
		app: APP_ID,
		schemaVersion: SCHEMA_VERSION,
		exportedAt: new Date().toISOString(),
		exportId: randomUUID(),
		stocks: portfolio.map(({ stock, lots, events, result }, i) => {
			const lotRef = new Map(lots.map((lot, j) => [String(lot._id), `L${j + 1}`]));
			const sellState = new Map(result.sells.map((s) => [s.id, s]));
			return {
				ref: `S${i + 1}`,
				stockName: stock.stockName,
				instrumentKey: stock.instrumentKey || subscriptionService.keyForSymbol(stock.stockName),
				lots: lots.map((lot) => ({
					ref: lotRef.get(String(lot._id)),
					date: new Date(lot.date).toISOString(),
					quantity: lot.quantity,
					price: lot.avgPrice,
				})),
				sells: events.map((e, j) => {
					const s = sellState.get(String(e._id));
					return {
						ref: `X${j + 1}`,
						date: new Date(e.date).toISOString(),
						quantity: e.quantity,
						price: e.price,
						pnl: s?.pnl ?? 0,
						allocations: (s?.allocations ?? []).map((a) => ({
							lot: lotRef.get(a.lotId),
							quantity: a.quantity,
							buyPrice: a.buyPrice,
							pnl: a.pnl,
						})),
					};
				}),
				summary: summarise(result),
			};
		}),
	};
}

export async function buildHoldingsCsv(userId) {
	const portfolio = await loadPortfolio(userId);
	const header = [
		"Symbol",
		"Quantity",
		"Avg buy price",
		"Invested",
		"Last price",
		"Current value",
		"Unrealised P&L",
		"Realised P&L",
	];
	const rows = portfolio.map(({ stock, result }) => {
		const { quantity, avgPrice, realisedPnl } = summarise(result);
		const key = stock.instrumentKey || subscriptionService.keyForSymbol(stock.stockName);
		const ltp = key ? marketCache.getLTP(key)?.ltp : null;
		const invested = round2(result.remainingCost);
		const value = ltp != null && quantity > 0 ? round2(ltp * quantity) : null;
		return [
			stock.stockName,
			quantity,
			avgPrice,
			invested,
			ltp ?? null,
			value,
			value != null ? round2(value - invested) : null,
			realisedPnl,
		];
	});
	return toCsv(header, rows);
}

export async function buildTransactionsCsv(userId) {
	const portfolio = await loadPortfolio(userId);
	const rows = [];
	for (const { stock, lots, events, result } of portfolio) {
		const pnlBySell = new Map(result.sells.map((s) => [s.id, s.pnl]));
		for (const lot of lots) {
			rows.push({
				date: new Date(lot.date),
				cells: ["BUY", lot.quantity, lot.avgPrice, round2(lot.quantity * lot.avgPrice), null],
				stockName: stock.stockName,
			});
		}
		for (const e of events) {
			rows.push({
				date: new Date(e.date),
				cells: ["SELL", e.quantity, e.price, round2(e.quantity * e.price), pnlBySell.get(String(e._id)) ?? 0],
				stockName: stock.stockName,
			});
		}
	}
	rows.sort((a, b) => a.date - b.date || a.stockName.localeCompare(b.stockName));
	return toCsv(
		["Date", "Symbol", "Type", "Quantity", "Price", "Amount", "Realised P&L"],
		rows.map((r) => [r.date, r.stockName, ...r.cells]),
	);
}
