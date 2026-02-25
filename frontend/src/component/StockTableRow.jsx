import { TableRow, TableCell, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BarChartIcon from "@mui/icons-material/BarChart";
import PropTypes from "prop-types";

export default function StockTableRow({
	stock,
	historyRows,
	activeTab,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	const rupee = (num) =>
		typeof num === "number" && !isNaN(num)
			? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
			: "—";

	if (activeTab === 1) {
		// Dormant: aggregate history
		const filteredHistory = historyRows.filter(
			(row) => row.stockId === stock._id
		);
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
			<TableRow hover>
				<TableCell>{stock.stockName}</TableCell>
				<TableCell align="right">{totalSoldQty}</TableCell>
				<TableCell align="right">{rupee(avgBuyPrice)}</TableCell>
				<TableCell align="right">{rupee(totalSoldCost)}</TableCell>
				<TableCell align="right">{rupee(avgSellPrice)}</TableCell>
				<TableCell align="right">{rupee(totalSellValue)}</TableCell>
				<TableCell
					align="right"
					style={{
						fontWeight: 700,
						color:
							totalPnl > 0 ? "#1a882c" : totalPnl < 0 ? "#c91b24" : "#1d1d1d",
					}}
				>
					{rupee(totalPnl)}
				</TableCell>
				<TableCell align="center">
					<IconButton color="primary" onClick={() => onAdd(stock)} title="Add">
						<AddIcon />
					</IconButton>
					<IconButton
						color="warning"
						disabled
						title="Sell"
						sx={{ ml: 0.5, opacity: 0.7 }}
					>
						<RemoveIcon />
					</IconButton>
					<IconButton
						color="info"
						onClick={() => onViewHistory(stock)}
						title="History"
						sx={{ ml: 0.5 }}
					>
						<BarChartIcon />
					</IconButton>
					<IconButton
						color="error"
						onClick={() => onDelete(stock)}
						title="Delete"
						sx={{ ml: 0.5 }}
					>
						<DeleteIcon />
					</IconButton>
				</TableCell>
			</TableRow>
		);
	} else {
		// Active: use stock fields
		const totalInvested =
			stock.quantity > 0 ? stock.quantity * stock.avgPrice : 0;
		const currVal =
			stock.quantity > 0 && stock.ltp
				? (stock.quantity * stock.ltp).toFixed(2)
				: 0;
		const pnl =
			stock.pnl !== undefined
				? stock.pnl
				: (stock.ltp - stock.avgPrice) * stock.quantity;
		return (
			<TableRow hover>
				<TableCell>{stock.stockName}</TableCell>
				<TableCell align="right">{stock.quantity}</TableCell>
				<TableCell align="right">{rupee(stock.avgPrice)}</TableCell>
				<TableCell align="right">{rupee(totalInvested)}</TableCell>
				<TableCell align="right">{rupee(stock.ltp)}</TableCell>
				<TableCell align="right">{rupee(currVal)}</TableCell>
				<TableCell
					align="right"
					style={{
						fontWeight: 700,
						color: pnl > 0 ? "#1a882c" : pnl < 0 ? "#c91b24" : "#1d1d1d",
					}}
				>
					{rupee(pnl)}
				</TableCell>
				<TableCell align="center">
					<IconButton color="primary" onClick={() => onAdd(stock)} title="Add">
						<AddIcon />
					</IconButton>
					<IconButton
						color="warning"
						onClick={() => onSell(stock._id)}
						title="Sell"
						disabled={stock.quantity <= 0}
						sx={{ ml: 0.5 }}
					>
						<RemoveIcon />
					</IconButton>
					<IconButton
						color="info"
						onClick={() => onViewHistory(stock)}
						title="History"
						sx={{ ml: 0.5 }}
					>
						<BarChartIcon />
					</IconButton>
					<IconButton
						color="error"
						onClick={() => onDelete(stock)}
						title="Delete"
						sx={{ ml: 0.5 }}
					>
						<DeleteIcon />
					</IconButton>
				</TableCell>
			</TableRow>
		);
	}
}

StockTableRow.propTypes = {
	stock: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		stockName: PropTypes.string.isRequired,
		quantity: PropTypes.number.isRequired,
		avgPrice: PropTypes.number.isRequired,
		ltp: PropTypes.number,
		pnl: PropTypes.number,
	}).isRequired,
	historyRows: PropTypes.arrayOf(PropTypes.object).isRequired,
	activeTab: PropTypes.number.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};
