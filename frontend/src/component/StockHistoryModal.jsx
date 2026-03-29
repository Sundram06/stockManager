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
	Paper,
	useTheme,
	useMediaQuery,
	SwipeableDrawer,
	Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import { dateFormatter } from "../util/util.mjs";

// Short date for mobile: "05 Jul 2025"
const fmtDate = (d) => {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("en-IN", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
};

const rupeeAbs = (n, dec = 0) =>
	typeof n === "number" && !isNaN(n)
		? `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: dec })}`
		: "—";

// --- Helper for totals ---
function computeHistoryTotals(historyRows) {
	let totalSoldQty = 0,
		totalSoldAmt = 0,
		totalSoldPL = 0,
		totalSoldCost = 0,
		totalSoldBuyQty = 0;
	let totalUnsoldQty = 0,
		totalUnsoldAmt = 0;
	let totalSellPriceQty = 0,
		totalBuyPriceQty = 0;

	historyRows.forEach((row) => {
		const soldQty = row.quantitySold || 0;
		const buyQty = row.quantity || 0;
		const avgBuy = row.avgPrice || 0;
		const sellPrice = row.sellingPrice || 0;
		const pnl = row.pnl || 0;

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

// ─── Mobile: individual lot card ─────────────────────────────────────────────

function LotCard({ lot, index }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const soldQty = lot.quantitySold || 0;
	const buyQty = lot.quantity || 0;
	const unsoldQty = buyQty - soldQty;
	const isSold = soldQty >= buyQty;
	const isPartial = soldQty > 0 && soldQty < buyQty;

	const pnlColor = lot.pnl > 0 ? green : lot.pnl < 0 ? red : "text.secondary";
	const pnlSign = lot.pnl >= 0 ? "+" : "−";

	const statusLabel = isSold ? "SOLD" : isPartial ? "PARTIAL" : "ACTIVE";
	const statusStyles = {
		SOLD: {
			bg: theme.palette.mode === "dark" ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.14)",
			color: theme.palette.text.secondary,
		},
		PARTIAL: {
			bg: theme.palette.mode === "dark" ? `${theme.palette.warning.main}22` : `${theme.palette.warning.main}1a`,
			color: theme.palette.warning.main,
		},
		ACTIVE: {
			bg: theme.palette.mode === "dark" ? "rgba(59,130,246,0.14)" : "rgba(59,130,246,0.09)",
			color: theme.palette.info.main,
		},
	}[statusLabel];

	return (
		<Box sx={{ px: 2, py: 1.1 }}>
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
				<Box
					sx={{
						px: 0.75,
						py: "2px",
						borderRadius: 0.75,
						bgcolor: statusStyles.bg,
					}}
				>
					<Typography
						sx={{
							fontSize: "0.58rem",
							fontWeight: 700,
							letterSpacing: "0.06em",
							color: statusStyles.color,
						}}
					>
						{statusLabel}
					</Typography>
				</Box>
			</Box>

			{/* Buy row */}
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
				<ArrowDownwardIcon
					sx={{ fontSize: "0.65rem", color: "text.disabled", flexShrink: 0 }}
				/>
				<Typography
					sx={{
						fontSize: "0.7rem",
						color: "text.secondary",
						flex: 1,
						lineHeight: 1.45,
					}}
				>
					{fmtDate(lot.date)}&ensp;{buyQty} qty @ ₹{parseFloat(lot.avgPrice || 0).toFixed(2)}
				</Typography>
				<Typography
					sx={{
						fontSize: "0.7rem",
						color: "text.secondary",
						fontVariantNumeric: "tabular-nums",
						flexShrink: 0,
					}}
				>
					Cost {rupeeAbs(buyQty * (lot.avgPrice || 0))}
				</Typography>
			</Box>

			{/* Sell row */}
			{soldQty > 0 && (
				<Box sx={{ display: "flex", alignItems: "center", gap: 0.6, mt: 0.3 }}>
					<ArrowUpwardIcon
						sx={{ fontSize: "0.65rem", color: pnlColor, flexShrink: 0 }}
					/>
					<Typography
						sx={{
							fontSize: "0.7rem",
							color: "text.secondary",
							flex: 1,
							lineHeight: 1.45,
						}}
					>
						{fmtDate(lot.dateSold)}&ensp;{soldQty} qty @ ₹{parseFloat(lot.sellingPrice || 0).toFixed(2)}
					</Typography>
					<Typography
						sx={{
							fontSize: "0.7rem",
							fontWeight: 600,
							color: pnlColor,
							fontVariantNumeric: "tabular-nums",
							flexShrink: 0,
						}}
					>
						{pnlSign}{rupeeAbs(lot.pnl)}
					</Typography>
				</Box>
			)}

			{/* Still held (partial lots only) */}
			{isPartial && (
				<Typography
					sx={{
						fontSize: "0.63rem",
						color: "text.disabled",
						mt: 0.3,
						pl: "18px",
					}}
				>
					{unsoldQty} shares still held
				</Typography>
			)}
		</Box>
	);
}

// ─── Mobile: summary footer ───────────────────────────────────────────────────

function MobileSummary({ totals }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const isDark = theme.palette.mode === "dark";

	const soldBg =
		totals.totalSoldPL > 0
			? isDark ? "rgba(16,185,129,0.14)" : "rgba(16,185,129,0.08)"
			: totals.totalSoldPL < 0
				? isDark ? "rgba(239,68,68,0.16)" : "rgba(239,68,68,0.08)"
				: "action.hover";

	const pnlColor =
		totals.totalSoldPL > 0 ? green : totals.totalSoldPL < 0 ? red : "text.secondary";
	const pnlSign = totals.totalSoldPL >= 0 ? "+" : "−";

	return (
		<Box sx={{ flexShrink: 0 }}>
			<Divider />

			{/* Total Sold */}
			{totals.totalSoldQty > 0 && (
				<Box sx={{ px: 2, py: 1.1, bgcolor: soldBg }}>
					<Typography
						sx={{
							fontSize: "0.58rem",
							fontWeight: 700,
							letterSpacing: "0.07em",
							color: "text.disabled",
							textTransform: "uppercase",
							mb: 0.4,
						}}
					>
						Total Sold
					</Typography>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
						<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", flex: 1, mr: 1 }}>
							{totals.totalSoldQty} qty&ensp;·&ensp;Avg Buy ₹{totals.avgBuyPriceForSold?.toFixed(2) ?? "—"}&ensp;·&ensp;Cost {rupeeAbs(totals.totalSoldCost)}
						</Typography>
						<Typography
							sx={{
								fontSize: "0.72rem",
								fontWeight: 700,
								color: pnlColor,
								fontVariantNumeric: "tabular-nums",
								flexShrink: 0,
							}}
						>
							{pnlSign}{rupeeAbs(totals.totalSoldPL)}
						</Typography>
					</Box>
					<Typography sx={{ fontSize: "0.66rem", color: "text.secondary", mt: 0.2 }}>
						Avg Sell ₹{totals.avgSoldPrice?.toFixed(2) ?? "—"}&ensp;·&ensp;Sell Value {rupeeAbs(totals.totalSoldAmt)}
					</Typography>
				</Box>
			)}

			<Divider />

			{/* Total Unsold */}
			{totals.totalUnsoldQty > 0 && (
				<Box
					sx={{
						px: 2,
						py: 1.1,
						pb: 1.75,
						bgcolor: isDark ? "rgba(59,130,246,0.10)" : "rgba(59,130,246,0.06)",
					}}
				>
					<Typography
						sx={{
							fontSize: "0.58rem",
							fontWeight: 700,
							letterSpacing: "0.07em",
							color: "text.disabled",
							textTransform: "uppercase",
							mb: 0.4,
						}}
					>
						Total Unsold
					</Typography>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
						<Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>
							{totals.totalUnsoldQty} qty&ensp;·&ensp;Avg Buy ₹{totals.avgBuyPrice?.toFixed(2) ?? "—"}
						</Typography>
						<Typography
							sx={{
								fontSize: "0.72rem",
								fontWeight: 600,
								color: "text.primary",
								fontVariantNumeric: "tabular-nums",
							}}
						>
							{rupeeAbs(totals.totalUnsoldAmt)}
						</Typography>
					</Box>
				</Box>
			)}
		</Box>
	);
}

// ─── Desktop: unchanged modal styles ─────────────────────────────────────────

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "96vw",
	maxWidth: 1200,
	maxHeight: "88vh",
	bgcolor: "background.paper",
	boxShadow: 24,
	p: { xs: 1.5, sm: 2.5, md: 3 },
	borderRadius: 2,
	display: "flex",
	flexDirection: "column",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function StockHistoryModal({ open, onClose, stockName, history }) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

	const sortedHistory = useMemo(
		() => history.slice().sort((a, b) => new Date(b.date) - new Date(a.date)),
		[history],
	);

	const totals = useMemo(() => computeHistoryTotals(sortedHistory), [sortedHistory]);

	const soldSummaryBg = (t) => {
		if (totals.totalSoldPL > 0)
			return t.palette.mode === "dark" ? "rgba(16, 185, 129, 0.16)" : "rgba(16, 185, 129, 0.10)";
		if (totals.totalSoldPL < 0)
			return t.palette.mode === "dark" ? "rgba(239, 68, 68, 0.18)" : "rgba(239, 68, 68, 0.10)";
		return t.palette.mode === "dark" ? "rgba(148, 163, 184, 0.14)" : "rgba(148, 163, 184, 0.08)";
	};

	const headerCellSx = {
		fontWeight: 700,
		whiteSpace: "nowrap",
		fontSize: { xs: "0.74rem", sm: "0.8rem" },
		py: 1.2,
	};
	const dataCellSx = {
		whiteSpace: "nowrap",
		fontSize: { xs: "0.78rem", sm: "0.84rem" },
		py: 1,
	};
	const numberCellSx = {
		...dataCellSx,
		textAlign: "right",
		fontVariantNumeric: "tabular-nums",
	};

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
						paddingBottom: "env(safe-area-inset-bottom, 12px)",
					},
				}}
			>
				{/* Drag handle */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						pt: 1.5,
						pb: 0.5,
						flexShrink: 0,
					}}
				>
					<Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
				</Box>

				{/* Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						px: 2,
						pt: 0.5,
						pb: 1,
						flexShrink: 0,
					}}
				>
					<Typography sx={{ fontSize: "0.95rem", fontWeight: 700 }}>
						{stockName} History
					</Typography>
					<IconButton size="small" onClick={onClose} aria-label="Close">
						<CloseIcon fontSize="small" />
					</IconButton>
				</Box>

				<Divider sx={{ flexShrink: 0 }} />

				{/* Lot cards — scrollable */}
				<Box sx={{ flex: 1, overflowY: "auto" }}>
					{sortedHistory.length === 0 ? (
						<Box sx={{ py: 4, textAlign: "center" }}>
							<Typography variant="body2" color="text.secondary">
								No history yet
							</Typography>
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

				{/* Summary footer */}
				<MobileSummary totals={totals} />
			</SwipeableDrawer>
		);
	}

	// ── Desktop (unchanged) ───────────────────────────────────────────────────
	return (
		<Modal open={open} onClose={onClose}>
			<Box sx={modalStyle}>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
						borderBottom: (t) => `1px solid ${t.palette.divider}`,
						pb: 1,
						flexShrink: 0,
					}}
				>
					<Typography variant="h6" fontWeight="bold">
						{stockName} History
					</Typography>
					<IconButton onClick={onClose} aria-label="Close">
						<CloseIcon />
					</IconButton>
				</Box>

				{/* Table */}
				<TableContainer
					component={Paper}
					elevation={0}
					sx={{
						flex: 1,
						overflow: "auto",
						borderRadius: 1,
						border: (t) => `1px solid ${t.palette.divider}`,
					}}
				>
					<Table size="medium" stickyHeader>
						<TableHead>
							<TableRow>
								<TableCell sx={headerCellSx}>Date Purchased</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>Quantity</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>Price</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>Total Cost Price</TableCell>
								<TableCell sx={headerCellSx}>Date Sold</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>Quantity Sold</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>Selling Price</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>Total Selling Price</TableCell>
								<TableCell sx={{ ...headerCellSx, textAlign: "right" }}>P&L</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedHistory.map((row, index) => {
								const costPrice =
									row.avgPrice !== undefined
										? (row.quantity * row.avgPrice).toFixed(2)
										: "—";
								const totalSellPrice =
									row.quantitySold && row.sellingPrice !== undefined
										? (row.quantitySold * row.sellingPrice).toFixed(2)
										: "—";
								return (
									<TableRow
										key={row._id}
										sx={{
											backgroundColor: (t) =>
												index % 2 === 0 ? t.palette.action.hover : "inherit",
										}}
									>
										<TableCell sx={dataCellSx}>{dateFormatter(row.date)}</TableCell>
										<TableCell sx={numberCellSx}>{row.quantity}</TableCell>
										<TableCell sx={numberCellSx}>
											{row.avgPrice !== undefined
												? parseFloat(row.avgPrice).toFixed(2)
												: "—"}
										</TableCell>
										<TableCell sx={numberCellSx}>{costPrice}</TableCell>
										<TableCell sx={dataCellSx}>
											{row.dateSold ? dateFormatter(row.dateSold) : "—"}
										</TableCell>
										<TableCell sx={numberCellSx}>{row.quantitySold || "—"}</TableCell>
										<TableCell sx={numberCellSx}>
											{row.sellingPrice !== undefined
												? parseFloat(row.sellingPrice).toFixed(2)
												: "—"}
										</TableCell>
										<TableCell sx={numberCellSx}>{totalSellPrice}</TableCell>
										<TableCell
											sx={{
												...numberCellSx,
												color:
													row.pnl > 0 ? "green" : row.pnl < 0 ? "red" : "inherit",
												fontWeight: "bold",
											}}
										>
											{row.pnl !== undefined ? parseFloat(row.pnl).toFixed(2) : "—"}
										</TableCell>
									</TableRow>
								);
							})}

							{/* Total Sold row */}
							<TableRow sx={{ backgroundColor: soldSummaryBg }}>
								<TableCell sx={{ ...dataCellSx, fontWeight: "bold" }}>Total Sold</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalSoldQty > 0 ? totals.totalSoldQty : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.avgBuyPriceForSold
										? parseFloat(totals.avgBuyPriceForSold).toFixed(2)
										: "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalSoldCost > 0 ? totals.totalSoldCost.toFixed(2) : "—"}
								</TableCell>
								<TableCell />
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalSoldQty > 0 ? totals.totalSoldQty : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.avgSoldPrice ? parseFloat(totals.avgSoldPrice).toFixed(2) : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalSoldAmt > 0 ? totals.totalSoldAmt.toFixed(2) : "—"}
								</TableCell>
								<TableCell
									sx={{
										...numberCellSx,
										fontWeight: "bold",
										color:
											totals.totalSoldPL > 0
												? "green"
												: totals.totalSoldPL < 0
													? "red"
													: "inherit",
									}}
								>
									{totals.totalSoldPL !== 0
										? parseFloat(totals.totalSoldPL).toFixed(2)
										: "—"}
								</TableCell>
							</TableRow>

							{/* Total Unsold row */}
							<TableRow
								sx={{
									backgroundColor: (t) =>
										t.palette.mode === "dark"
											? "rgba(59, 130, 246, 0.12)"
											: "rgba(59, 130, 246, 0.06)",
								}}
							>
								<TableCell sx={{ ...dataCellSx, fontWeight: "bold" }}>Total Unsold</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalUnsoldQty > 0 ? totals.totalUnsoldQty : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.avgBuyPrice ? parseFloat(totals.avgBuyPrice).toFixed(2) : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalUnsoldAmt > 0 ? totals.totalUnsoldAmt.toFixed(2) : "—"}
								</TableCell>
								<TableCell />
								<TableCell />
								<TableCell />
								<TableCell />
								<TableCell />
							</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</Modal>
	);
}

StockHistoryModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	stockName: PropTypes.string.isRequired,
	history: PropTypes.array.isRequired,
};
