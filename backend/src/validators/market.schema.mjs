import { z } from "zod";

export const PRICE_HISTORY_RANGES = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

export const priceHistoryQuerySchema = z.object({
	range: z.enum(PRICE_HISTORY_RANGES).default("ALL"),
});

// z.string() also rejects ?q=a&q=b, which Express parses into an array.
export const instrumentSearchQuerySchema = z.object({
	q: z
		.string({ message: "Query param 'q' must be text" })
		.trim()
		.min(2, "Query param 'q' must be at least 2 characters")
		.max(50, "Query param 'q' must be at most 50 characters"),
});
