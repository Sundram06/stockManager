// Display formatting for money and percentages. One definition, so the same
// number never appears two ways on two screens.

const EMPTY = "—";

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

/**
 * "₹1,23,456.78" in Indian digit grouping, or "—" when there is no number.
 * `absolute` drops the minus sign, for places that show direction separately.
 */
export function rupee(value, { decimals = 2, absolute = false } = {}) {
	if (!isNumber(value)) return EMPTY;
	const n = absolute ? Math.abs(value) : value;
	return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`;
}

/** "+₹1,200" / "−₹1,200", using a real minus sign rather than a hyphen. */
export function signedRupee(value, { decimals = 2 } = {}) {
	if (!isNumber(value)) return EMPTY;
	const sign = value > 0 ? "+" : value < 0 ? "−" : "";
	return `${sign}${rupee(value, { decimals, absolute: true })}`;
}

/** "+6.67%", or null so callers can leave the space empty. */
export function percent(value, { decimals = 2 } = {}) {
	if (!isNumber(value)) return null;
	return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/** Theme colour for a gain, a loss, or neither. */
export function toneColor(value, theme) {
	if (!isNumber(value) || value === 0) return theme.palette.text.secondary;
	return value > 0 ? theme.palette.success.main : theme.palette.error.main;
}
