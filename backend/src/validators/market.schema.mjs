import { z } from "zod";

export const PRICE_HISTORY_RANGES = ["1W", "1M", "3M", "6M", "1Y", "ALL"];

export const priceHistoryQuerySchema = z.object({
	range: z.enum(PRICE_HISTORY_RANGES).default("ALL"),
});
