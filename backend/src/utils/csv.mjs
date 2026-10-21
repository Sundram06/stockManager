// CSV output helpers. Pure: no database, no I/O.

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

/**
 * Reads CSV text into row objects keyed by header name. Handles quoted fields
 * containing commas, quotes and newlines, and tolerates CRLF and a leading BOM.
 * Header names are lowercased with spaces turned into underscores, so
 * "Trade Date" and "trade_date" both arrive as trade_date.
 */
export function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = "";
	let quoted = false;

	const input = text.replace(/^\uFEFF/, "");
	const endField = () => {
		row.push(field);
		field = "";
	};
	const endRow = () => {
		endField();
		if (row.some((cell) => cell.trim() !== "")) rows.push(row);
		row = [];
	};

	for (let i = 0; i < input.length; i++) {
		const char = input[i];

		if (quoted) {
			if (char !== '"') field += char;
			else if (input[i + 1] === '"') {
				field += '"';
				i++;
			} else quoted = false;
			continue;
		}

		if (char === '"') quoted = true;
		else if (char === ",") endField();
		else if (char === "\n") endRow();
		else if (char !== "\r") field += char;
	}
	if (field !== "" || row.length) endRow();

	if (!rows.length) return { headers: [], rows: [] };

	const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
	return {
		headers,
		rows: rows.slice(1).map((cells) => {
			const record = {};
			headers.forEach((name, i) => {
				record[name] = (cells[i] ?? "").trim();
			});
			return record;
		}),
	};
}
