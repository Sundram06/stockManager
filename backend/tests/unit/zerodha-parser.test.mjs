import { describe, expect, it } from "vitest";
import { FileFormatError, parsePortfolioFile } from "../../src/services/transfer/parsers/index.mjs";

const HEADER = "symbol,isin,trade_date,exchange,segment,series,trade_type,auction,quantity,price,trade_id,order_id,order_execution_time";

const tradebook = (...rows) => [HEADER, ...rows].join("\n");

const infyBuy =
	"INFY,INE009A01021,2025-01-06,NSE,EQ,EQ,buy,false,10,1500.25,1234567,24010600001,2025-01-06T10:42:33";

describe("zerodha tradebook", () => {
	it("reads a trade into the shape the pipeline expects", () => {
		const { source, matching, trades } = parsePortfolioFile(tradebook(infyBuy));

		expect(source).toBe("ZERODHA");
		expect(matching).toBe("day");
		expect(trades).toHaveLength(1);
		expect(trades[0]).toMatchObject({
			stockName: "INFY",
			side: "BUY",
			quantity: 10,
			price: 1500.25,
			isin: "INE009A01021",
			exchange: "NSE",
			externalTradeId: "zerodha:2025-01-06:1234567",
			externalOrderId: "24010600001",
		});
	});

	it("reads the execution time as India time", () => {
		const { trades } = parsePortfolioFile(tradebook(infyBuy));
		// 10:42:33 IST is 05:12:33 UTC, whatever the server's own zone.
		expect(trades[0].date.toISOString()).toBe("2025-01-06T05:12:33.000Z");
	});

	it("accepts the older header that used tradingsymbol and a different order", () => {
		const { trades } = parsePortfolioFile(
			["trade_date,tradingsymbol,trade_type,quantity,price", "2025-02-03,TCS,sell,4,3500"].join("\n"),
		);

		expect(trades[0]).toMatchObject({ stockName: "TCS", side: "SELL", quantity: 4, price: 3500 });
	});

	it("marks the date as estimated when the file has no execution time", () => {
		const { trades } = parsePortfolioFile(
			["symbol,trade_date,trade_type,quantity,price", "TCS,2025-02-03,buy,4,3500"].join("\n"),
		);

		expect(trades[0].isEstimatedDate).toBe(true);
		expect(trades[0].date.toISOString()).toBe("2025-02-02T18:30:00.000Z");
	});

	it("skips anything that is not delivery equity", () => {
		const { trades, skipped } = parsePortfolioFile(
			tradebook(
				infyBuy,
				"NIFTY25JANFUT,,2025-01-06,NFO,FO,,buy,false,50,21000,999,888,2025-01-06T11:00:00",
			),
		);

		expect(trades).toHaveLength(1);
		expect(skipped.segment).toBe(1);
	});

	it("skips rows it cannot read without losing the rest", () => {
		const { trades, skipped } = parsePortfolioFile(
			tradebook(infyBuy, "TCS,,not-a-date,NSE,EQ,EQ,buy,false,abc,,,,"),
		);

		expect(trades).toHaveLength(1);
		expect(skipped.unreadable).toBe(1);
	});

	it("explains a file that is missing a column it needs", () => {
		expect(() => parsePortfolioFile(["symbol,trade_date,quantity", "INFY,2025-01-06,10"].join("\n"))).toThrow(
			/missing the side, price column/,
		);
	});

	it("says so when the file holds no equity trades", () => {
		expect(() =>
			parsePortfolioFile(
				tradebook("NIFTY25JANFUT,,2025-01-06,NFO,FO,,buy,false,50,21000,999,888,2025-01-06T11:00:00"),
			),
		).toThrow(FileFormatError);
	});

	it("still recognises a VittNest backup", () => {
		const backup = JSON.stringify({
			app: "vittnest",
			schemaVersion: 1,
			stocks: [{ stockName: "INFY", lots: [{ date: "2025-01-06T00:00:00.000Z", quantity: 1, price: 100 }], sells: [] }],
		});

		expect(parsePortfolioFile(backup)).toMatchObject({ source: "VITTNEST", matching: "exact" });
	});
});
