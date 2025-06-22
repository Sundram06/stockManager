import PropTypes from "prop-types";
import {
	Paper,
	Typography,
	Button,
	Stack,
	IconButton,
	Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import BarChartIcon from "@mui/icons-material/BarChart";

// Simple Pill component for displaying stats
const Pill = ({
	label,
	value,
	color = "#333",
	bg = "#f5f7fb",
	minWidth = 80,
}) => (
	<Box
		sx={{
			px: 1.5,
			py: 0.6,
			bgcolor: bg,
			borderRadius: 2,
			minWidth,
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			mr: 1,
			mb: 1,
			boxShadow: "0 1px 2px 0 rgba(180,180,200,0.07)",
		}}
	>
		<Typography variant="caption" sx={{ fontWeight: 500, color: "#666" }}>
			{label}
		</Typography>
		<Typography
			variant="body1"
			sx={{ fontWeight: 700, color, fontSize: "1.02rem", letterSpacing: 0.1 }}
		>
			{value}
		</Typography>
	</Box>
);

export default function StockCard({
	stock,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
	isDormant,
	historyRows,
}) {
	const rupee = (num) =>
		typeof num === "number" && !isNaN(num)
			? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
			: "—";

	const titleSection = (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				mb: 1,
			}}
		>
			<Typography
				variant="subtitle1"
				fontWeight="bold"
				sx={{ color: "#222", fontSize: "1.18rem" }}
			>
				{stock.stockName}
			</Typography>
			<IconButton
				onClick={() => onDelete(stock)}
				sx={{
					backgroundColor: "#fff",
					"&:hover": { backgroundColor: "#f4f4f4" },
					p: "5px",
				}}
				aria-label="delete"
				size="small"
			>
				<DeleteIcon fontSize="small" color="error" />
			</IconButton>
		</Box>
	);

	if (isDormant) {
		const filteredHistory =
			historyRows?.filter((row) => row.stockId === stock._id) || [];
		let totalSoldQty = 0,
			totalSoldCost = 0,
			totalSellValue = 0,
			totalPnl = 0,
			avgBuyPrice = 0,
			avgSellPrice = 0;
		filteredHistory.forEach((row) => {
			if (row.quantitySold && row.quantitySold > 0) {
				totalSoldQty += row.quantitySold;
				totalSoldCost += row.quantitySold * row.avgPrice;
				totalSellValue += row.quantitySold * (row.sellingPrice || 0);
				totalPnl += row.pnl || 0;
			}
		});
		if (totalSoldQty > 0) {
			avgBuyPrice = totalSoldCost / totalSoldQty;
			avgSellPrice = totalSellValue / totalSoldQty;
		}
		return (
			<Paper
				elevation={3}
				sx={{
					p: 2.5,
					width: 350,
					borderRadius: 3,
					mb: 2,
					display: "flex",
					flexDirection: "column",
					backgroundColor: "#fff",
					boxShadow: "0 2px 8px 0 rgba(100,100,130,0.10)",
					borderTop: "5px solid #1976d2",
				}}
			>
				{titleSection}
				<Typography
					variant="body2"
					fontWeight="bold"
					color="text.secondary"
					sx={{ mb: 1.5, fontSize: "1.05rem" }}
				>
					Dormant Stock{" "}
					<span style={{ fontWeight: 400 }}>(All shares sold)</span>
				</Typography>
				<Box sx={{ display: "flex", flexWrap: "wrap", mb: 1.2 }}>
					<Pill label="Total Sold" value={totalSoldQty} />
					<Pill label="Avg Buy" value={rupee(avgBuyPrice)} />
					<Pill label="Total Cost" value={rupee(totalSoldCost)} />
				</Box>
				<Box sx={{ display: "flex", flexWrap: "wrap", mb: 1.2 }}>
					<Pill label="Avg Sell" value={rupee(avgSellPrice)} />
					<Pill label="Sold Value" value={rupee(totalSellValue)} />
				</Box>
				<Box sx={{ mt: 1, mb: 2, display: "flex", justifyContent: "center" }}>
					<Typography
						variant="h6"
						sx={{
							fontWeight: 800,
							color:
								totalPnl > 0 ? "#1a882c" : totalPnl < 0 ? "#c91b24" : "#1d1d1d",
							fontSize: "1.25rem",
						}}
					>
						P&L: {rupee(totalPnl)}
					</Typography>
				</Box>
				<Stack direction="row" spacing={1.5} mt={1} justifyContent="center">
					<Button
						variant="contained"
						color="primary"
						size="small"
						startIcon={<AddIcon />}
						onClick={() => onAdd(stock)}
					>
						ADD
					</Button>
					<Button
						variant="contained"
						color="warning"
						size="small"
						startIcon={<RemoveIcon />}
						disabled
						sx={{ opacity: 0.7 }}
					>
						SELL
					</Button>
					<Button
						variant="outlined"
						color="primary"
						size="small"
						startIcon={<BarChartIcon />}
						onClick={() => onViewHistory(stock)}
					>
						HISTORY
					</Button>
				</Stack>
			</Paper>
		);
	}

	// Active (holding) card:
	const displayQuantity = stock.quantity > 0 ? stock.quantity : 0;
	const displayAvgCost = stock.quantity > 0 ? stock.avgPrice : 0;
	const totalInvested =
		stock.quantity > 0 ? stock.quantity * stock.avgPrice : 0;
	const displayCurrVal =
		stock.quantity > 0 && stock.ltp
			? (stock.quantity * stock.ltp).toFixed(2)
			: 0;
	const pnl =
		stock.pnl !== undefined
			? stock.pnl
			: (stock.ltp - stock.avgPrice) * stock.quantity;

	return (
		<Paper
			elevation={3}
			sx={{
				p: 2.5,
				width: 350,
				borderRadius: 3,
				mb: 2,
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#fff",
				boxShadow: "0 2px 8px 0 rgba(100,100,130,0.10)",
				borderTop: "5px solid #1976d2",
			}}
		>
			{titleSection}
			<Box sx={{ display: "flex", flexWrap: "wrap", mb: 1.2 }}>
				<Pill label="Qty" value={displayQuantity} />
				<Pill label="Avg Buy" value={rupee(displayAvgCost)} />
				<Pill label="Total Invested" value={rupee(totalInvested)} />
			</Box>
			<Box sx={{ display: "flex", flexWrap: "wrap", mb: 1.2 }}>
				<Pill label="LTP" value={rupee(stock.ltp)} />
				<Pill label="Curr. Value" value={rupee(displayCurrVal)} />
			</Box>
			<Box sx={{ mt: 1, mb: 2, display: "flex", justifyContent: "center" }}>
				<Typography
					variant="h6"
					sx={{
						fontWeight: 800,
						color: pnl > 0 ? "#1a882c" : pnl < 0 ? "#c91b24" : "#1d1d1d",
						fontSize: "1.25rem",
					}}
				>
					P&L: {rupee(pnl)}
				</Typography>
			</Box>
			<Stack direction="row" spacing={1.5} mt={1} justifyContent="center">
				<Button
					variant="contained"
					color="primary"
					size="small"
					startIcon={<AddIcon />}
					onClick={() => onAdd(stock)}
				>
					ADD
				</Button>
				<Button
					variant="contained"
					color="warning"
					size="small"
					startIcon={<RemoveIcon />}
					onClick={() => onSell(stock._id)}
				>
					SELL
				</Button>
				<Button
					variant="outlined"
					color="primary"
					size="small"
					startIcon={<BarChartIcon />}
					onClick={() => onViewHistory(stock)}
				>
					HISTORY
				</Button>
			</Stack>
		</Paper>
	);
}

// PropTypes

Pill.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	color: PropTypes.string,
	bg: PropTypes.string,
	minWidth: PropTypes.number,
};

StockCard.propTypes = {
	stock: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	isDormant: PropTypes.bool,
	historyRows: PropTypes.array,
};
