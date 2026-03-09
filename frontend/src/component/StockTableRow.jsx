import { TableRow, TableCell, IconButton } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BarChartIcon from "@mui/icons-material/BarChart";
import PropTypes from "prop-types";

function StockTableRow({
	stock,
	activeTab,
	historyByStockId,
	activeStockMetrics,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	const handleAdd = useCallback(() => onAdd(stock), [onAdd, stock]);
	const handleViewHistory = useCallback(
		() => onViewHistory(stock),
		[onViewHistory, stock],
	);
	const handleDelete = useCallback(() => onDelete(stock), [onDelete, stock]);
	const handleSell = useCallback(() => onSell(stock._id), [onSell, stock._id]);

	const rupee = (num) =>
		typeof num === "number" && !isNaN(num)
			? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
			: "—";

	const dormantMetrics = useMemo(() => {
		if (activeTab !== 1) {
			return {
				totalSoldQty: 0,
				totalSoldCost: 0,
				totalSellValue: 0,
				totalPnl: 0,
				avgBuyPrice: 0,
				avgSellPrice: 0,
			};
		}

		const filteredHistory = historyByStockId[stock._id] || [];
		let totalSoldQty = 0;
		let totalSoldCost = 0;
		let totalSellValue = 0;
		let totalPnl = 0;

		filteredHistory.forEach((row) => {
			if (row.quantitySold && row.quantitySold > 0) {
				totalSoldQty += row.quantitySold;
				totalSoldCost += row.quantitySold * row.avgPrice;
				totalSellValue += row.quantitySold * (row.sellingPrice || 0);
				totalPnl += row.pnl || 0;
			}
		});

		const avgBuyPrice = totalSoldQty > 0 ? totalSoldCost / totalSoldQty : 0;
		const avgSellPrice = totalSoldQty > 0 ? totalSellValue / totalSoldQty : 0;

		return {
			totalSoldQty,
			totalSoldCost,
			totalSellValue,
			totalPnl,
			avgBuyPrice,
			avgSellPrice,
		};
	}, [activeTab, historyByStockId, stock._id]);

	const activeMetrics = useMemo(() => {
		// Use pre-aggregated metrics from parent to avoid floating-point rounding issues
		const metrics = activeStockMetrics[stock._id];
		const totalInvested = metrics ? metrics.totalInvested : 0;
		const avgPriceFromHistory = metrics ? metrics.avgPrice : stock.avgPrice;

		const currVal =
			stock.quantity > 0 && stock.ltp
				? (stock.quantity * stock.ltp).toFixed(2)
				: 0;
		const pnl =
			stock.pnl !== undefined
				? stock.pnl
				: (stock.ltp - avgPriceFromHistory) * stock.quantity;

		return {
			totalInvested,
			currVal,
			pnl,
			avgPrice: avgPriceFromHistory,
		};
	}, [stock, activeStockMetrics]);

	if (activeTab === 1) {
		const {
			totalSoldQty,
			totalSoldCost,
			totalSellValue,
			totalPnl,
			avgBuyPrice,
			avgSellPrice,
		} = dormantMetrics;

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
					<IconButton color="primary" onClick={handleAdd} title="Add">
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
						onClick={handleViewHistory}
						title="History"
						sx={{ ml: 0.5 }}
					>
						<BarChartIcon />
					</IconButton>
					<IconButton
						color="error"
						onClick={handleDelete}
						title="Delete"
						sx={{ ml: 0.5 }}
					>
						<DeleteIcon />
					</IconButton>
				</TableCell>
			</TableRow>
		);
	} else {
		const { totalInvested, currVal, pnl, avgPrice } = activeMetrics;

		return (
			<TableRow hover>
				<TableCell>{stock.stockName}</TableCell>
				<TableCell align="right">{stock.quantity}</TableCell>
				<TableCell align="right">{rupee(avgPrice)}</TableCell>
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
					<IconButton color="primary" onClick={handleAdd} title="Add">
						<AddIcon />
					</IconButton>
					<IconButton
						color="warning"
						onClick={handleSell}
						title="Sell"
						disabled={stock.quantity <= 0}
						sx={{ ml: 0.5 }}
					>
						<RemoveIcon />
					</IconButton>
					<IconButton
						color="info"
						onClick={handleViewHistory}
						title="History"
						sx={{ ml: 0.5 }}
					>
						<BarChartIcon />
					</IconButton>
					<IconButton
						color="error"
						onClick={handleDelete}
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
	activeTab: PropTypes.number.isRequired,
	historyByStockId: PropTypes.object.isRequired,
	activeStockMetrics: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

const MemoizedStockTableRow = memo(StockTableRow);

export default MemoizedStockTableRow;
