import { memo, useCallback } from "react";
import {
	Box,
	Paper,
	Typography,
	Stack,
	Divider,
} from "@mui/material";
import PropTypes from "prop-types";
import StockActions from "./StockActions";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

const rupee = (num) =>
	typeof num === "number" && !isNaN(num)
		? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
		: "—";

function MetricItem({ label, value, emphasize, color }) {
	return (
		<Box>
			<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
				{label}
			</Typography>
			<Typography
				variant="body2"
				sx={{ fontWeight: emphasize ? 700 : 500, color: color || "text.primary" }}
			>
				{value}
			</Typography>
		</Box>
	);
}

MetricItem.propTypes = {
	label: PropTypes.string.isRequired,
	value: PropTypes.string.isRequired,
	emphasize: PropTypes.bool,
	color: PropTypes.string,
};

MetricItem.defaultProps = {
	emphasize: false,
	color: "",
};

function PortfolioMobileCard({
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
	const handleSell = useCallback(() => onSell(stock._id), [onSell, stock._id]);
	const handleViewHistory = useCallback(() => onViewHistory(stock), [onViewHistory, stock]);
	const handleDelete = useCallback(() => onDelete(stock), [onDelete, stock]);

	if (activeTab === 1) {
		const dormant = computeDormantMetrics(historyByStockId[stock._id] || []);
		const pnlColor =
			dormant.totalPnl > 0
				? "#1a882c"
				: dormant.totalPnl < 0
					? "#c91b24"
					: "#1d1d1d";

		return (
			<Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
				<Typography variant="h6" sx={{ mb: 1.5, fontSize: "1.1rem", fontWeight: 700 }}>
					{stock.stockName}
				</Typography>
				<Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
					<MetricItem label="Sold Qty" value={`${dormant.totalSoldQty}`} />
					<MetricItem label="Avg Buy" value={rupee(dormant.avgBuyPrice)} />
					<MetricItem label="Avg Sell" value={rupee(dormant.avgSellPrice)} />
					<MetricItem label="Sold Cost" value={rupee(dormant.totalSoldCost)} />
					<MetricItem label="Sell Value" value={rupee(dormant.totalSellValue)} />
					<MetricItem
						label="Realized P&L"
						value={rupee(dormant.totalPnl)}
						emphasize
						color={pnlColor}
					/>
				</Stack>
				<Divider sx={{ my: 1.5 }} />
				<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
					<StockActions
						onAdd={handleAdd}
						onSell={null}
						onViewHistory={handleViewHistory}
						onDelete={handleDelete}
						canSell={false}
					/>
				</Box>
			</Paper>
		);
	}

	const metrics = activeStockMetrics[stock._id];
	const totalInvested = metrics ? metrics.totalInvested : 0;
	const avgPrice = metrics ? metrics.avgPrice : stock.avgPrice;
	const currVal = stock.quantity > 0 && stock.ltp ? stock.quantity * stock.ltp : 0;
	const pnl =
		stock.pnl !== undefined ? stock.pnl : (stock.ltp - avgPrice) * stock.quantity;
	const pnlColor = pnl > 0 ? "#1a882c" : pnl < 0 ? "#c91b24" : "#1d1d1d";

	return (
		<Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
			<Typography variant="h6" sx={{ mb: 1.5, fontSize: "1.1rem", fontWeight: 700 }}>
				{stock.stockName}
			</Typography>
			<Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
				<MetricItem label="Quantity" value={`${stock.quantity}`} />
				<MetricItem label="Avg Buy" value={rupee(avgPrice)} />
				<MetricItem label="Invested" value={rupee(totalInvested)} />
				<MetricItem label="LTP" value={rupee(stock.ltp)} />
				<MetricItem label="Current Value" value={rupee(currVal)} />
				<MetricItem label="P&L" value={rupee(pnl)} emphasize color={pnlColor} />
			</Stack>
			<Divider sx={{ my: 1.5 }} />
			<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
				<StockActions
					onAdd={handleAdd}
					onSell={handleSell}
					onViewHistory={handleViewHistory}
					onDelete={handleDelete}
					canSell={stock.quantity > 0}
				/>
			</Box>
		</Paper>
	);
}

PortfolioMobileCard.propTypes = {
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

function PortfolioMobileList(props) {
	const {
		stocks,
		activeTab,
		historyByStockId,
		activeStockMetrics,
		onAdd,
		onSell,
		onViewHistory,
		onDelete,
	} = props;

	if (stocks.length === 0) {
		return (
			<Paper elevation={2} sx={{ mb: 4, p: 3, textAlign: "center", borderRadius: 2 }}>
				<Typography variant="h6" color="text.secondary" gutterBottom>
					{activeTab === 0
						? "No active stocks in your portfolio"
						: "No dormant stocks"}
				</Typography>
				<Typography variant="body2" color="text.tertiary">
					{activeTab === 0
						? "Start by adding a stock to track your investments"
						: "Stocks become dormant when you sell all shares"}
				</Typography>
			</Paper>
		);
	}

	return (
		<Stack spacing={1.5} sx={{ mb: 4 }}>
			{stocks.map((stock) => (
				<PortfolioMobileCard
					key={stock._id}
					stock={stock}
					activeTab={activeTab}
					historyByStockId={historyByStockId}
					activeStockMetrics={activeStockMetrics}
					onAdd={onAdd}
					onSell={onSell}
					onViewHistory={onViewHistory}
					onDelete={onDelete}
				/>
			))}
		</Stack>
	);
}

PortfolioMobileList.propTypes = {
	stocks: PropTypes.arrayOf(PropTypes.object).isRequired,
	activeTab: PropTypes.number.isRequired,
	historyByStockId: PropTypes.object.isRequired,
	activeStockMetrics: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

const MemoizedPortfolioMobileList = memo(PortfolioMobileList);
export default MemoizedPortfolioMobileList;
