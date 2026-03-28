import { z } from "zod";

export const createStockSchema = z.object({
	stockName: z.string().trim().min(1, "stockName is required"),
	quantity: z.coerce.number({ message: "quantity must be a number" }),
	avgPrice: z.coerce.number({ message: "avgPrice must be a number" }),
});
