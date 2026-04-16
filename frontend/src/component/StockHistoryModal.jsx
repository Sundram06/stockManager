/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { useMemo } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Modal,
	Box,
	Typography,
	IconButton,
	TableContainer,
	useTheme,
	useMediaQuery,
	SwipeableDrawer,
	Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { dateFormatter } from "../util/util.mjs";

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtDate = (d) => {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const rupee = (n, dec = 0) =>
	typeof n === "number" && !isNaN(n)
		? `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: dec })}`
		: "—";

// ─── Compute totals ───────────────────────────────────────────────────────────
function computeHistoryTotals(historyRows) {
	let totalBoughtQty = 0;
	let totalSoldQty = 0;
	let totalSoldAmt = 0;
	let totalSoldPL = 0;
	let totalSoldCost = 0;
	let totalSellPriceQty = 0;
	let totalSoldBuyQty = 0;
	let totalUnsoldQty = 0;
	let totalUnsoldAmt = 0;
	let totalBuyPriceQty = 0;

	historyRows.forEach((row) => {
		const soldQty = row.quantitySold || 0;
		const buyQty = row.quantity || 0;
		const avgBuy = row.avgPrice || 0;
		const sellPrice = row.sellingPrice || 0;
		const pnl = row.pnl || 0;

		totalBoughtQty += buyQty;

		if (soldQty > 0) {
			totalSoldQty += soldQty;
			totalSoldAmt += soldQty * sellPrice;
			totalSoldPL += pnl;
			totalSellPriceQty += soldQty * sellPrice;
			totalSoldBuyQty += soldQty;
			totalSoldCost += soldQty * avgBuy;
			totalBuyPriceQty += soldQty * avgBuy;
		}

		const unsoldQty = buyQty - soldQty;
		if (unsoldQty > 0) {
			totalUnsoldQty += unsoldQty;
			totalUnsoldAmt += unsoldQty * avgBuy;
		}
	});

	return {
		totalBoughtQty,
		totalSoldQty,
		totalSoldAmt,
		avgSoldPrice: totalSoldQty > 0 ? totalSellPriceQty / totalSoldQty : null,
		avgBuyPriceForSold: totalSoldBuyQty > 0 ? totalBuyPriceQty / totalSoldBuyQty : null,
		totalSoldPL,
		totalSoldCost,
		totalUnsoldQty,
		totalUnsoldAmt,
		avgBuyPrice: totalUnsoldQty > 0 ? totalUnsoldAmt / totalUnsoldQty : null,
	};
}

// ─── Lot status helpers ───────────────────────────────────────────────────────
function getLotStatus(row) {
	const soldQty = row.quantitySold || 0;
	const buyQty = row.quantity || 0;
	if (soldQty >= buyQty) return "SOLD";
	if (soldQty > 0) return "PARTIAL";
	return "HOLDING";
}

function LotStatusBadge({ status }) {
	const theme = useTheme();
	if (status === "SOLD") return null; // sold rows just dim, no badge

	const styles = {
		HOLDING: {
			bg: `${theme.palette.primary.main}20`,
			color: theme.palette.primary.main,
			label: "HOLDING",
		},
		PARTIAL: {
			bg: `${theme.palette.warning.main}22`,
			color: theme.palette.warning.main,
			label: "PARTIAL",
		},
	}[status];

	return (
		<Box
			sx={{
				display: "inline-flex",
				px: 0.75,
				py: "2px",
				borderRadius: "4px",
				bgcolor: styles.bg,
			}}
		>
			<Typography
				sx={{
					fontSize: "0.6rem",
					fontWeight: 700,
					letterSpacing: "0.06em",
					color: styles.color,
					lineHeight: 1.4,
				}}
			>
				{styles.label}
			</Typography>
		</Box>
	);
}

// ─── ACTIVE / EXITED header badge ─────────────────────────────────────────────
function StockStatusBadge({ isActive }) {
	const theme = useTheme();
	return (
		<Box
			sx={{
				display: "inline-flex",
				px: 1,
				py: "3px",
				borderRadius: "6px",
				bgcolor: isActive
					? `${theme.palette.primary.main}22`
					: `${theme.palette.text.secondary}18`,
				border: `1px solid ${isActive ? theme.palette.primary.main + "44" : theme.palette.divider}`,
			}}
		>
			<Typography
				sx={{
					fontSize: "0.62rem",
					fontWeight: 700,
					letterSpacing: "0.08em",
					color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
					lineHeight: 1.4,
				}}
			>
				{isActive ? "ACTIVE" : "EXITED"}
			</Typography>
		</Box>
	);
}

// ─── Pinned 4-metric footer ───────────────────────────────────────────────────
function HistoryFooter({ totals, unrealizedPnL }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const realizedColor =
		totals.totalSoldPL > 0 ? green : totals.totalSoldPL < 0 ? red : "text.secondary";
	const unrealizedColor =
		unrealizedPnL != null
			? unrealizedPnL > 0 ? green : unrealizedPnL < 0 ? red : "text.secondary"
			: "text.secondary";

	const metrics = [
		{
			label: "Total Bought",
			value: `${totals.totalBoughtQty} units`,
			color: "text.primary",
		},
		{
			label: "Total Sold",
			value: totals.totalSoldQty > 0 ? `${totals.totalSoldQty} units` : "—",
			color: "text.primary",
		},
		{
			label: "Realized P&L",
			value: totals.totalSoldQty > 0
				? `${totals.totalSoldPL >= 0 ? "+" : "−"}${rupee(totals.totalSoldPL)}`
				: "—",
			color: totals.totalSoldQty > 0 ? realizedColor : "text.disabled",
		},
		{
			label: "Unrealized P&L",
			value: unrealizedPnL != null && totals.totalUnsoldQty > 0
				? `${unrealizedPnL >= 0 ? "+" : "−"}${rupee(unrealizedPnL)}`
				: "—",
			color: totals.totalUnsoldQty > 0 ? unrealizedColor : "text.disabled",
		},
	];

	return (
		<Box
			sx={{
				flexShrink: 0,
				borderTop: `1px solid ${theme.palette.divider}`,
				bgcolor: "background.paper",
				display: "grid",
				gridTemplateColumns: "repeat(4, 1fr)",
				px: { xs: 1.5, sm: 2.5 },
				py: { xs: 1.25, sm: 1.5 },
				gap: 1,
			}}
		>
			{metrics.map((m) => (
				<Box key={m.label}>
					<Typography
						sx={{
							fontSize: "0.58rem",
							fontWeight: 700,
							letterSpacing: "0.08em",
							color: "text.secondary",
							textTransform: "uppercase",
							mb: 0.3,
						}}
					>
						{m.label}
					</Typography>
					<Typography
						sx={{
							fontSize: { xs: "0.8rem", sm: "0.9rem" },
							fontWeight: 700,
							color: m.color,
							fontVariantNumeric: "tabular-nums",
							letterSpacing: "-0.01em",
						}}
					>
						{m.value}
					</Typography>
				</Box>
			))}
		</Box>
	);
}

// ─── Mobile: individual lot card ─────────────────────────────────────────────
function LotCard({ lot, index }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const soldQty = lot.quantitySold || 0;
	const buyQty = lot.quantity || 0;
	const unsoldQty = buyQty - soldQty;
	const status = getLotStatus(lot);

	const pnlColor = lot.pnl > 0 ? green : lot.pnl < 0 ? red : "text.secondary";
	const pnlSign = lot.pnl >= 0 ? "+" : "−";

	const statusStyles = {
		SOLD: {
			bg: theme.palette.mode === "dark" ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.14)",
			color: theme.palette.text.secondary,
			label: "SOLD",
		},
		PARTIAL: {
			bg: `${theme.palette.warning.main}22`,
			color: theme.palette.warning.main,
			label: "PARTIAL",
		},
		HOLDING: {
			bg: `${theme.palette.primary.main}20`,
			color: theme.palette.primary.main,
			label: "HOLDING",
		},
	}[status];

	return (
		<Box
			sx={{
				px: 2,
				py: 1.1,
				opacity: status === "SOLD" ? 0.7 : 1,
			}}
		>
			{/* Lot header */}
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
				<Typography
					sx={{
						fontSize: "0.62rem",
						fontWeight: 700,
						color: "text.disabled",
						letterSpacing: "0.07em",
						textTransform: "uppercase",
					}}
				>
					Lot {index + 1}
				</Typography>
				<Box sx={{ px: 0.75, py: "2px", borderRadius: 0.75, bgcolor: statusStyles.bg }}>
					<Typography sx={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.06em", color: statusStyles.color }}>
						{statusStyles.label}
					</Typography>
				</Box>
			</Box>

			{/* Buy row */}
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
				<ArrowDownwardIcon sx={{ fontSize: "0.65rem", color: "text.disabled", flexShrink: 0 }} />
				<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", flex: 1, lineHeight: 1.45 }}>
					{fmtDate(lot.date)}&ensp;
					{status === "PARTIAL" ? `${soldQty}/${buyQty}` : buyQty} qty @ ₹{parseFloat(lot.avgPrice || 0).toFixed(2)}
				</Typography>
				<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
					Cost {rupee(buyQty * (lot.avgPrice || 0))}
				</Typography>
			</Box>

			{/* Sell row */}
			{soldQty > 0 && (
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.3 }}>
					<ArrowUpwardIcon sx={{ fontSize: "0.65rem", color: pnlColor, flexShrink: 0 }} />
					<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", flex: 1, lineHeight: 1.45 }}>
						{fmtDate(lot.dateSold)}&ensp;{soldQty} qty @ ₹{parseFloat(lot.sellingPrice || 0).toFixed(2)}
					</Typography>
					<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: pnlColor, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
						{pnlSign}{rupee(lot.pnl)}
					</Typography>
				</Box>
			)}

			{/* Still held note for partial */}
			{status === "PARTIAL" && (
				<Typography sx={{ fontSize: "0.63rem", color: "text.disabled", mt: 0.3, pl: "18px" }}>
					{unsoldQty} shares still held
				</Typography>
			)}
		</Box>
	);
}

// ─── Mobile: 4-metric summary footer ─────────────────────────────────────────
function MobileFooter({ totals, unrealizedPnL }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const realizedColor = totals.totalSoldPL > 0 ? green : totals.totalSoldPL < 0 ? red : "text.secondary";
	const unrealizedColor = unrealizedPnL != null
		? unrealizedPnL > 0 ? green : unrealizedPnL < 0 ? red : "text.secondary"
		: "text.secondary";

	return (
		<Box sx={{ flexShrink: 0 }}>
			<Divider />
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: "repeat(2, 1fr)",
					gap: 0,
				}}
			>
				{[
					{ label: "Total Bought", value: `${totals.totalBoughtQty} units`, color: "text.primary" },
					{ label: "Total Sold", value: totals.totalSoldQty > 0 ? `${totals.totalSoldQty} units` : "—", color: "text.primary" },
					{
						label: "Realized P&L",
						value: totals.totalSoldQty > 0
							? `${totals.totalSoldPL >= 0 ? "+" : "−"}${rupee(totals.totalSoldPL)}`
							: "—",
						color: totals.totalSoldQty > 0 ? realizedColor : "text.disabled",
					},
					{
						label: "Unrealized P&L",
						value: unrealizedPnL != null && totals.totalUnsoldQty > 0
							? `${unrealizedPnL >= 0 ? "+" : "−"}${rupee(unrealizedPnL)}`
							: "—",
						color: totals.totalUnsoldQty > 0 ? unrealizedColor : "text.disabled",
					},
				].map((m, i) => (
					<Box
						key={m.label}
						sx={{
							px: 2,
							py: 1.1,
							borderTop: `1px solid ${theme.palette.divider}`,
							borderRight: i % 2 === 0 ? `1px solid ${theme.palette.divider}` : "none",
							pb: i >= 2 ? "calc(1.1 * 8px + env(safe-area-inset-bottom, 8px))" : undefined,
						}}
					>
						<Typography sx={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.07em", color: "text.disabled", textTransform: "uppercase", mb: 0.3 }}>
							{m.label}
						</Typography>
						<Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>
							{m.value}
						</Typography>
					</Box>
				))}
			</Box>
		</Box>
	);
}

// ─── Desktop table header cell sx ────────────────────────────────────────────
const hcSx = {
	fontWeight: 700,
	whiteSpace: "nowrap",
	fontSize: "0.68rem",
	letterSpacing: "0.06em",
	textTransform: "uppercase",
	color: "text.secondary",
	py: 1.25,
	bgcolor: "background.elevated",
	borderBottom: "2px solid",
	borderColor: "divider",
};

const numSx = {
	whiteSpace: "nowrap",
	fontSize: "0.82rem",
	py: 1.1,
	textAlign: "right",
	fontVariantNumeric: "tabular-nums",
};

const dateSx = {
	whiteSpace: "nowrap",
	fontSize: "0.82rem",
	py: 1.1,
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function StockHistoryModal({ open, onClose, stock, stockName, history, ltpMap }) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	// Ascending sort (oldest first = FIFO order)
	const sortedHistory = useMemo(
		() => history.slice().sort((a, b) => new Date(a.date) - new Date(b.date)),
		[history],
	);

	const totals = useMemo(() => computeHistoryTotals(sortedHistory), [sortedHistory]);

	const isActive = (stock?.quantity ?? 0) > 0;

	// Unrealized P&L = (LTP - avgBuyPrice) × unsold qty
	const ltp = ltpMap?.[stockName]?.ltp ?? null;
	const unrealizedPnL = useMemo(() => {
		if (ltp == null || totals.totalUnsoldQty === 0 || totals.avgBuyPrice == null) return null;
		return (ltp - totals.avgBuyPrice) * totals.totalUnsoldQty;
	}, [ltp, totals]);

	const hasSameDateLots = useMemo(() => {
		const seen = new Set();
		for (const row of history) {
			const d = row.date ? new Date(row.date).toISOString().split("T")[0] : null;
			if (d) {
				if (seen.has(d)) return true;
				seen.add(d);
			}
		}
		return false;
	}, [history]);

	// ── Mobile ────────────────────────────────────────────────────────────────
	if (isMobile) {
		return (
			<SwipeableDrawer
				anchor="bottom"
				open={open}
				onClose={onClose}
				onOpen={() => {}}
				disableSwipeToOpen
				PaperProps={{
					sx: {
						borderRadius: "16px 16px 0 0",
						maxHeight: "90vh",
						display: "flex",
						flexDirection: "column",
					},
				}}
			>
				{/* Drag handle */}
				<Box sx={{ display: "flex", justifyContent: "center", pt: 1.5, pb: 0.5, flexShrink: 0 }}>
					<Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
				</Box>

				{/* Header */}
				<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", px: 2, pt: 0.5, pb: 1, flexShrink: 0 }}>
					<Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.25 }}>
							<Typography sx={{ fontSize: "0.95rem", fontWeight: 700 }}>{stockName}</Typography>
							<StockStatusBadge isActive={isActive} />
						</Box>
						<Typography sx={{ fontSize: "0.68rem", color: "text.secondary", letterSpacing: "0.04em" }}>
							NSE · {stockName}
						</Typography>
					</Box>
					<IconButton size="small" onClick={onClose} aria-label="Close" sx={{ mt: -0.25 }}>
						<CloseIcon fontSize="small" />
					</IconButton>
				</Box>

				<Divider sx={{ flexShrink: 0 }} />

				{hasSameDateLots && (
					<Box sx={{ px: 2, py: 0.75, bgcolor: "action.hover", flexShrink: 0 }}>
						<Typography sx={{ fontSize: "0.65rem", color: "text.secondary", lineHeight: 1.4 }}>
							Multiple lots on the same day — shares are distributed proportionally during a sell.
						</Typography>
					</Box>
				)}

				{/* Lot cards — scrollable */}
				<Box sx={{ flex: 1, overflowY: "auto" }}>
					{sortedHistory.length === 0 ? (
						<Box sx={{ py: 4, textAlign: "center" }}>
							<Typography variant="body2" color="text.secondary">No history yet</Typography>
						</Box>
					) : (
						sortedHistory.map((lot, i) => (
							<Box key={lot._id}>
								<LotCard lot={lot} index={i} />
								{i < sortedHistory.length - 1 && <Divider />}
							</Box>
						))
					)}
				</Box>

				<MobileFooter totals={totals} unrealizedPnL={unrealizedPnL} />
			</SwipeableDrawer>
		);
	}

	// ── Desktop ───────────────────────────────────────────────────────────────
	return (
		<Modal open={open} onClose={onClose}>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: "96vw",
					maxWidth: 1100,
					maxHeight: "88vh",
					bgcolor: "background.paper",
					border: `1px solid ${theme.palette.divider}`,
					boxShadow: 16,
					borderRadius: 2,
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{/* ── Modal header ─────────────────────────────────────── */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "flex-start",
						px: { xs: 2, sm: 3 },
						pt: { xs: 2, sm: 2.5 },
						pb: { xs: 1.5, sm: 2 },
						flexShrink: 0,
						borderBottom: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Box>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
							<Typography
								sx={{
									fontSize: { xs: "1.1rem", sm: "1.25rem" },
									fontWeight: 700,
									letterSpacing: "-0.01em",
									lineHeight: 1,
								}}
							>
								{stockName}
							</Typography>
							<StockStatusBadge isActive={isActive} />
						</Box>
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "0.05em" }}>
							NSE · {stockName} · Transaction History
						</Typography>
					</Box>
					<IconButton onClick={onClose} aria-label="Close" size="small" sx={{ mt: -0.5 }}>
						<CloseIcon />
					</IconButton>
				</Box>

				{/* Same-date lots notice */}
				{hasSameDateLots && (
					<Box
						sx={{
							px: 3,
							py: 0.75,
							bgcolor: (t) => t.palette.mode === "dark" ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.10)",
							borderBottom: `1px solid ${theme.palette.divider}`,
							flexShrink: 0,
						}}
					>
						<Typography variant="caption" color="text.secondary">
							Multiple lots purchased on the same day — shares are distributed proportionally across those lots during a sell.
						</Typography>
					</Box>
				)}

				{/* ── Table ────────────────────────────────────────────── */}
				<TableContainer sx={{ flex: 1, overflow: "auto" }}>
					<Table size="small" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell sx={{ ...hcSx, width: 60 }}>Lot</TableCell>
								<TableCell sx={hcSx}>Buy Date</TableCell>
								<TableCell sx={{ ...hcSx, textAlign: "right" }}>Qty</TableCell>
								<TableCell sx={{ ...hcSx, textAlign: "right" }}>Buy Price</TableCell>
								<TableCell sx={{ ...hcSx, textAlign: "right" }}>Cost</TableCell>
								<TableCell sx={hcSx}>Sell Date</TableCell>
								<TableCell sx={{ ...hcSx, textAlign: "right" }}>Sell Price</TableCell>
								<TableCell sx={{ ...hcSx, textAlign: "right" }}>P&L</TableCell>
								<TableCell sx={{ ...hcSx, textAlign: "center" }}>Status</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedHistory.map((row, index) => {
								const soldQty = row.quantitySold || 0;
								const buyQty = row.quantity || 0;
								const status = getLotStatus(row);
								const isSold = status === "SOLD";

								const pnlColor =
									row.pnl > 0 ? theme.palette.success.main
									: row.pnl < 0 ? theme.palette.error.main
									: "inherit";

								return (
									<TableRow
										key={row._id}
										sx={{
											opacity: isSold ? 0.65 : 1,
											"& td": { borderColor: "divider" },
											"&:hover": { bgcolor: "action.hover" },
										}}
									>
										{/* Lot # */}
										<TableCell sx={{ ...dateSx, pl: { xs: 2, sm: 3 } }}>
											<Typography
												sx={{
													fontSize: "0.7rem",
													fontWeight: 700,
													color: "text.secondary",
													fontVariantNumeric: "tabular-nums",
													letterSpacing: "0.04em",
												}}
											>
												L{index + 1}
											</Typography>
										</TableCell>

										{/* Buy Date */}
										<TableCell sx={dateSx}>{dateFormatter(row.date)}</TableCell>

										{/* Qty — shows `soldQty/totalQty` for partial */}
										<TableCell sx={numSx}>
											{status === "PARTIAL"
												? <Typography component="span" sx={{ fontSize: "0.82rem", fontVariantNumeric: "tabular-nums" }}>
													<Typography component="span" sx={{ fontWeight: 700, color: "warning.main", fontSize: "inherit" }}>{soldQty}</Typography>
													<Typography component="span" sx={{ color: "text.disabled", fontSize: "inherit" }}>/{buyQty}</Typography>
												  </Typography>
												: buyQty
											}
										</TableCell>

										{/* Buy Price */}
										<TableCell sx={numSx}>
											{row.avgPrice !== undefined ? `₹${parseFloat(row.avgPrice).toFixed(2)}` : "—"}
										</TableCell>

										{/* Cost */}
										<TableCell sx={numSx}>
											{row.avgPrice !== undefined ? rupee(buyQty * row.avgPrice) : "—"}
										</TableCell>

										{/* Sell Date */}
										<TableCell sx={dateSx}>
											{row.dateSold ? dateFormatter(row.dateSold) : "—"}
										</TableCell>

										{/* Sell Price */}
										<TableCell sx={numSx}>
											{row.sellingPrice !== undefined && soldQty > 0
												? `₹${parseFloat(row.sellingPrice).toFixed(2)}`
												: "—"}
										</TableCell>

										{/* P&L */}
										<TableCell
											sx={{
												...numSx,
												fontWeight: 700,
												color: pnlColor,
											}}
										>
											{row.pnl != null && soldQty > 0
												? `${row.pnl >= 0 ? "+" : "−"}${rupee(row.pnl)}`
												: "—"}
										</TableCell>

										{/* Status badge */}
										<TableCell sx={{ ...dateSx, textAlign: "center" }}>
											<LotStatusBadge status={status} />
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>

				{/* ── Pinned footer ─────────────────────────────────────── */}
				<HistoryFooter totals={totals} unrealizedPnL={unrealizedPnL} />
			</Box>
		</Modal>
	);
}

StockHistoryModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	stockName: PropTypes.string.isRequired,
	history: PropTypes.array.isRequired,
	stock: PropTypes.object,
	ltpMap: PropTypes.object,
};
