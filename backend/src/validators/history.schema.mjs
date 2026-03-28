import { z } from "zod";

export const createHistorySchema = z.object({
	stockId: z.string().trim().min(1, "stockId is required"),
	quantity: z.coerce.number({ message: "quantity must be a number" }),
	avgPrice: z.coerce.number({ message: "avgPrice must be a number" }),
	date: z.coerce.date().optional(),
});

export const sellHistorySchema = z.object({
	stockId: z.string().trim().min(1, "stockId is required"),
	quantity: z
		.coerce
		.number({ message: "quantity must be a number" })
		.positive("quantity must be a positive number"),
	avgPrice: z.coerce.number({ message: "avgPrice must be a number" }),
	date: z.coerce.date().optional(),
});
