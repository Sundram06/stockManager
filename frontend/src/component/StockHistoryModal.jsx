import PropTypes from "prop-types";
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
	width: "90%",
	maxWidth: 850,
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 3,
	borderRadius: 2,
};

export default function StockHistoryModal({
	open,
	onClose,
	stockName,
	history,
}) {
	const sortedHistory = history
		.slice()
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	const totals = computeHistoryTotals(sortedHistory);

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
						borderBottom: "1px solid #ddd",
						pb: 1,
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
				<TableContainer component={Paper} elevation={0}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: "#f5f5f5" }}>
								<TableCell>Date Purchased</TableCell>
								<TableCell>Quantity</TableCell>
								<TableCell>Price</TableCell>
								<TableCell>Total Cost Price</TableCell>
								<TableCell>Date Sold</TableCell>
								<TableCell>Quantity Sold</TableCell>
								<TableCell>Selling Price</TableCell>
								<TableCell>Total Selling Price</TableCell>
								<TableCell>P&L</TableCell>
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
											backgroundColor: index % 2 === 0 ? "#fafafa" : "inherit",
										}}
									>
										<TableCell>{dateFormatter(history.date)}</TableCell>
										<TableCell>{history.quantity}</TableCell>
										<TableCell>
											{history.avgPrice !== undefined
												? parseFloat(history.avgPrice).toFixed(2)
												: "—"}
										</TableCell>
										<TableCell>{costPrice}</TableCell>
										<TableCell>
											{history.dateSold ? dateFormatter(history.dateSold) : "—"}
										</TableCell>
										<TableCell>{history.quantitySold || "—"}</TableCell>
										<TableCell>
											{history.sellingPrice !== undefined
												? parseFloat(history.sellingPrice).toFixed(2)
												: "—"}
										</TableCell>
										<TableCell>{totalSellPrice}</TableCell>
										<TableCell
											style={{
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
							<TableRow sx={{ backgroundColor: "#e3f7e8" }}>
								<TableCell sx={{ fontWeight: "bold" }}>Total Sold</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.totalSoldQty > 0 ? totals.totalSoldQty : "—"}
								</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.avgBuyPriceForSold
										? parseFloat(totals.avgBuyPriceForSold).toFixed(2)
										: "—"}
								</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.totalSoldCost > 0
										? totals.totalSoldCost.toFixed(2)
										: "—"}
								</TableCell>
								<TableCell />
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.totalSoldQty > 0 ? totals.totalSoldQty : "—"}
								</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.avgSoldPrice
										? parseFloat(totals.avgSoldPrice).toFixed(2)
										: "—"}
								</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.totalSoldAmt > 0
										? totals.totalSoldAmt.toFixed(2)
										: "—"}
								</TableCell>
								<TableCell
									sx={{
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
							<TableRow sx={{ backgroundColor: "#f3f3fa" }}>
								<TableCell sx={{ fontWeight: "bold" }}>Total Unsold</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.totalUnsoldQty > 0 ? totals.totalUnsoldQty : "—"}
								</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
									{totals.avgBuyPrice
										? parseFloat(totals.avgBuyPrice).toFixed(2)
										: "—"}
								</TableCell>
								<TableCell sx={{ fontWeight: "bold" }}>
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
