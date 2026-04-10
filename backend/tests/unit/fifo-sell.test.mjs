import { describe, expect, it } from "vitest";
import { applyFifoSell } from "../../src/utils/fifo-sell.mjs";

const makeRow = ({ quantity, avgPrice, date, quantitySold = 0, sellingPrice = 0, pnl = 0 }) => {
	return {
		quantity,
		avgPrice,
		date: date ? new Date(date) : undefined,
		quantitySold,
		sellingPrice,
		pnl,
		dateSold: null,
		save: async () => {},
	};
};

describe("applyFifoSell", () => {
	it("sells quantity in FIFO order and computes pnl", async () => {
		const row1 = makeRow({ quantity: 10, avgPrice: 100, date: "2025-01-01" });
		const row2 = makeRow({ quantity: 5, avgPrice: 120, date: "2025-02-01" });

		const result = await applyFifoSell({
			fifoRows: [row1, row2],
			quantityToSell: 12,
			sellingPrice: 130,
			dateSold: new Date("2026-01-01T00:00:00.000Z"),
		});

		expect(result.error).toBeUndefined();
		expect(result.totalPnl).toBe(320);
		expect(result.updatedRows.length).toBe(2);
		expect(row1.quantitySold).toBe(10);
		expect(row2.quantitySold).toBe(2);
	});

	it("returns error when sell quantity exceeds available stock", async () => {
		const row = makeRow({ quantity: 3, avgPrice: 100, date: "2025-01-01" });

		const result = await applyFifoSell({
			fifoRows: [row],
			quantityToSell: 5,
			sellingPrice: 110,
			dateSold: new Date("2026-01-01T00:00:00.000Z"),
		});

		expect(result.error).toBe("Not enough stock to sell");
		expect(result.statusCode).toBe(400);
	});
});
