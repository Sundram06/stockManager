import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "../../src/utils/csv.mjs";
import { FileFormatError, parsePortfolioFile } from "../../src/services/transfer/parsers/index.mjs";

describe("csvCell", () => {
	it.each([
		["=HYPERLINK(\"http://x\")", "\"'=HYPERLINK(\"\"http://x\"\")\""],
		["+91 call me", "'+91 call me"],
		["-SUM(A1)", "'-SUM(A1)"],
		["@cmd", "'@cmd"],
		["\tTAB", "'\tTAB"],
		["INFY", "INFY"],
		["A, B", "\"A, B\""],
	])("escapes text %j as %j", (input, expected) => {
		expect(csvCell(input)).toBe(expected);
	});

	it("writes negative numbers as plain numbers, not escaped text", () => {
		expect(csvCell(-1250.5)).toBe("-1250.5");
		expect(csvCell(0)).toBe("0");
	});

	it("writes missing values and non-finite numbers as empty cells", () => {
		expect(csvCell(null)).toBe("");
		expect(csvCell(undefined)).toBe("");
		expect(csvCell(Number.NaN)).toBe("");
	});

	it("joins rows with CRLF", () => {
		expect(toCsv(["a", "b"], [[1, "x"]])).toBe("a,b\r\n1,x\r\n");
	});
});

describe("parsePortfolioFile", () => {
	const backup = (stocks) => JSON.stringify({ app: "vittnest", schemaVersion: 1, stocks });

	it("turns lots and sells into canonical trades with normalised symbols", () => {
		const { trades } = parsePortfolioFile(
			backup([
				{
					stockName: " infy ",
					lots: [{ date: "2025-01-02", quantity: 10, price: 100 }],
					sells: [{ date: "2025-02-03T00:00:00.000Z", quantity: 4, price: 120 }],
				},
			]),
		);
		expect(trades.map((t) => [t.stockName, t.side, t.quantity, t.price, t.source])).toEqual([
			["INFY", "BUY", 10, 100, "VITTNEST"],
			["INFY", "SELL", 4, 120, "VITTNEST"],
		]);
		expect(trades[0].date).toBeInstanceOf(Date);
	});

	it.each([
		["a zero quantity", [{ stockName: "X", lots: [{ date: "2025-01-01", quantity: 0, price: 1 }] }], /more than 0/],
		["a negative price", [{ stockName: "X", lots: [{ date: "2025-01-01", quantity: 1, price: -1 }] }], /negative/],
		["a future date", [{ stockName: "X", lots: [{ date: "2999-01-01", quantity: 1, price: 1 }] }], /future/],
	])("rejects %s", (_label, stocks, message) => {
		expect(() => parsePortfolioFile(backup(stocks))).toThrow(FileFormatError);
		expect(() => parsePortfolioFile(backup(stocks))).toThrow(message);
	});
});
