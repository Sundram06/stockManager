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
