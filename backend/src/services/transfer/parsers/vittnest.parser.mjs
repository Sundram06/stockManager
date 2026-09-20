import { z } from "zod";
import { FileFormatError, normalizeSymbol } from "../file-format.mjs";

// Reads a VittNest backup (what GET /api/export/json writes) into
// CanonicalTrade[]. Allocations and summaries in the file are ignored: they are
// derived values, and the import recomputes them.

export const SCHEMA_VERSION = 1;
export const APP_ID = "vittnest";

// Accepts full ISO timestamps (what we export) and bare YYYY-MM-DD dates.
const dateField = z
	.string()
	.trim()
	.min(1, "date is required")
	.transform((s, ctx) => {
		const d = new Date(s);
		if (Number.isNaN(d.getTime())) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: `"${s}" is not a valid date` });
			return z.NEVER;
		}
		if (d.getTime() > Date.now() + 24 * 60 * 60 * 1000) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${s} is in the future` });
			return z.NEVER;
		}
		return d;
	});

const tradeRow = z.object({
	date: dateField,
	quantity: z.number({ message: "quantity must be a number" }).positive("quantity must be more than 0"),
	price: z.number({ message: "price must be a number" }).nonnegative("price can't be negative"),
	externalTradeId: z.string().optional(),
});

const backupSchema = z.object({
	app: z.literal(APP_ID),
	schemaVersion: z.literal(SCHEMA_VERSION),
	exportedAt: z.string().optional(),
	stocks: z.array(
		z.object({
			stockName: z.string().trim().min(1, "stockName is required"),
			instrumentKey: z.string().trim().min(1).optional().nullable(),
			isin: z.string().trim().min(1).optional().nullable(),
			lots: z.array(tradeRow).default([]),
			sells: z.array(tradeRow).default([]),
		}),
	),
});

const describeIssue = (issue) => {
	const where = issue.path.length ? ` (at ${issue.path.join(".")})` : "";
	return `${issue.message}${where}`;
};

/** True when this parser recognises the file, so the registry can pick it. */
export const claims = (data) => Boolean(data) && typeof data === "object" && data.app === APP_ID;

export function parse(data) {
	if (typeof data.schemaVersion === "number" && data.schemaVersion > SCHEMA_VERSION) {
		throw new FileFormatError(
			"This backup was made by a newer version of VittNest. Refresh the page and try again.",
		);
	}

	const parsed = backupSchema.safeParse(data);
	if (!parsed.success) {
		throw new FileFormatError(`This backup has a problem: ${describeIssue(parsed.error.issues[0])}`);
	}

	const trades = [];
	for (const stock of parsed.data.stocks) {
		const base = {
			stockName: normalizeSymbol(stock.stockName),
			instrumentKey: stock.instrumentKey || undefined,
			isin: stock.isin || undefined,
			source: "VITTNEST",
		};
		for (const lot of stock.lots) trades.push({ ...base, side: "BUY", ...lot });
		for (const sell of stock.sells) trades.push({ ...base, side: "SELL", ...sell });
	}
	return { source: "VITTNEST", exportedAt: parsed.data.exportedAt ?? null, trades };
}
