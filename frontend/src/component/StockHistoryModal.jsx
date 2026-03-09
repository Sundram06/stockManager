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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { dateFormatter } from "../util/util.mjs";

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

		// Sold portion (even partial sells)
		if (soldQty > 0) {
			totalSoldQty += soldQty;
			totalSoldAmt += soldQty * sellPrice;
			totalSoldPL += pnl;
			totalSellPriceQty += soldQty * sellPrice;
			totalSoldBuyQty += soldQty;
			totalSoldCost += soldQty * avgBuy;
			totalBuyPriceQty += soldQty * avgBuy;
		}

		// Unsold portion (leftover in the lot)
		const unsoldQty = buyQty - soldQty;
		if (unsoldQty > 0) {
			totalUnsoldQty += unsoldQty;
			totalUnsoldAmt += unsoldQty * avgBuy;
		}
	});

	return {
		// Sold
		totalSoldQty,
		totalSoldAmt,
		avgSoldPrice: totalSoldQty > 0 ? totalSellPriceQty / totalSoldQty : null,
		avgBuyPriceForSold:
			totalSoldBuyQty > 0 ? totalBuyPriceQty / totalSoldBuyQty : null,
		totalSoldPL,
		totalSoldCost,
		// Unsold
		totalUnsoldQty,
		totalUnsoldAmt,
		avgBuyPrice: totalUnsoldQty > 0 ? totalUnsoldAmt / totalUnsoldQty : null,
	};
}

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

export default function StockHistoryModal({
	open,
	onClose,
	stockName,
	history,
}) {
	const sortedHistory = useMemo(
		() => history.slice().sort((a, b) => new Date(b.date) - new Date(a.date)),
		[history],
	);

	const totals = useMemo(
		() => computeHistoryTotals(sortedHistory),
		[sortedHistory],
	);

	const soldSummaryBg = (theme) => {
		if (totals.totalSoldPL > 0) {
			return theme.palette.mode === "dark"
				? "rgba(16, 185, 129, 0.16)"
				: "rgba(16, 185, 129, 0.10)";
		}

		if (totals.totalSoldPL < 0) {
			return theme.palette.mode === "dark"
				? "rgba(239, 68, 68, 0.18)"
				: "rgba(239, 68, 68, 0.10)";
		}

		return theme.palette.mode === "dark"
			? "rgba(148, 163, 184, 0.14)"
			: "rgba(148, 163, 184, 0.08)";
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
						borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
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
						border: (theme) => `1px solid ${theme.palette.divider}`,
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
							{sortedHistory.map((history, index) => {
								const costPrice =
									history.avgPrice !== undefined
										? (history.quantity * history.avgPrice).toFixed(2)
										: "—";
								const totalSellPrice =
									history.quantitySold && history.sellingPrice !== undefined
										? (history.quantitySold * history.sellingPrice).toFixed(2)
										: "—";
								return (
									<TableRow
										key={history._id}
										sx={{
											backgroundColor: (theme) => index % 2 === 0 ? theme.palette.action.hover : "inherit",
										}}
									>
										<TableCell sx={dataCellSx}>{dateFormatter(history.date)}</TableCell>
										<TableCell sx={numberCellSx}>{history.quantity}</TableCell>
										<TableCell sx={numberCellSx}>
											{history.avgPrice !== undefined
												? parseFloat(history.avgPrice).toFixed(2)
												: "—"}
										</TableCell>
										<TableCell sx={numberCellSx}>{costPrice}</TableCell>
										<TableCell sx={dataCellSx}>
											{history.dateSold ? dateFormatter(history.dateSold) : "—"}
										</TableCell>
										<TableCell sx={numberCellSx}>{history.quantitySold || "—"}</TableCell>
										<TableCell sx={numberCellSx}>
											{history.sellingPrice !== undefined
												? parseFloat(history.sellingPrice).toFixed(2)
												: "—"}
										</TableCell>
										<TableCell sx={numberCellSx}>{totalSellPrice}</TableCell>
										<TableCell
											sx={{
												...numberCellSx,
												color:
													history.pnl > 0
														? "green"
														: history.pnl < 0
															? "red"
															: "inherit",
												fontWeight: "bold",
											}}
										>
											{history.pnl !== undefined
												? parseFloat(history.pnl).toFixed(2)
												: "—"}
										</TableCell>
									</TableRow>
								);
							})}

							{/* --- Summary: TOTAL SOLD ROW --- */}
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
									{totals.totalSoldCost > 0
										? totals.totalSoldCost.toFixed(2)
										: "—"}
								</TableCell>
								<TableCell />
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalSoldQty > 0 ? totals.totalSoldQty : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.avgSoldPrice
										? parseFloat(totals.avgSoldPrice).toFixed(2)
										: "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalSoldAmt > 0
										? totals.totalSoldAmt.toFixed(2)
										: "—"}
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
							{/* --- Summary: TOTAL UNSOLD ROW --- */}
							<TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.06)' }}>
								<TableCell sx={{ ...dataCellSx, fontWeight: "bold" }}>Total Unsold</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalUnsoldQty > 0 ? totals.totalUnsoldQty : "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.avgBuyPrice
										? parseFloat(totals.avgBuyPrice).toFixed(2)
										: "—"}
								</TableCell>
								<TableCell sx={{ ...numberCellSx, fontWeight: "bold" }}>
									{totals.totalUnsoldAmt > 0
										? totals.totalUnsoldAmt.toFixed(2)
										: "—"}
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
