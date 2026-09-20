// File formats for moving a portfolio in and out of VittNest. Pure: no
// database, no I/O.
//
// Every importable file is parsed into the same shape, a list of
// CanonicalTrade, so the import pipeline (dedupe → simulate → preview →
// commit) doesn't care where the trades came from. The VittNest backup is the
// first parser; broker files plug in here later.
//
//   CanonicalTrade = {
//     stockName, instrumentKey?, isin?,
//     side: "BUY" | "SELL",
//     date: Date, quantity: number, price: number,
//     source: string, externalTradeId?
//   }
import { createHash } from "node:crypto";
import { z } from "zod";

export const SCHEMA_VERSION = 1;
export const APP_ID = "vittnest";

export class FileFormatError extends Error {}

export const hashContent = (content) => createHash("sha256").update(content).digest("hex");

export const normalizeSymbol = (name) => String(name ?? "").trim().toUpperCase();

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

/**
 * Parses file text into CanonicalTrade[]. Throws FileFormatError with a
 * message fit to show the user.
 */
export function parsePortfolioFile(content) {
	let data;
	try {
		data = JSON.parse(content);
	} catch {
		throw new FileFormatError(
			"This file isn't a VittNest backup (it isn't valid JSON). Broker files are coming soon.",
		);
	}

	if (!data || typeof data !== "object" || data.app !== APP_ID) {
		throw new FileFormatError("This file isn't a VittNest backup. Broker files are coming soon.");
	}
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

// ─── CSV ─────────────────────────────────────────────────────────────────────

// A cell starting with = + - @ (or tab / CR) is run as a formula by Excel and
// Sheets. Prefix those with ' so a symbol or note can't execute. Numbers are
// written as numbers, so negative P&L stays numeric.
export function csvCell(value) {
	if (value === null || value === undefined) return "";
	if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
	let s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
	if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
	return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const toCsv = (header, rows) =>
	[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
