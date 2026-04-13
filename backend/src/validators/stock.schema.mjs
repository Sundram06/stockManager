import { z } from "zod";

export const createStockSchema = z.object({
	stockName: z.string().trim().min(1, "stockName is required"),
	quantity: z.coerce.number({ message: "quantity must be a number" }),
	avgPrice: z.coerce.number({ message: "avgPrice must be a number" }),
	date: z.coerce.date().optional(),
	instrumentKey: z.string().optional(), // e.g. "NSE_EQ|INE009A01021" from instrument search
});
