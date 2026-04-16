/* eslint-disable react/prop-types */
import { TableRow, TableCell, Box, Typography, useTheme } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import StockActions from "./StockActions";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

// ─── P&L badge ───────────────────────────────────────────────────────────────
function PnlBadge({ pnl, pct, theme }) {
	const isPos = pnl > 0;
	const isNeg = pnl < 0;
	const accent = isPos
		? theme.palette.success.main
		: isNeg
		? theme.palette.error.main
		: theme.palette.text.secondary;

	const absRupee = `₹${Math.abs(pnl).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
	const sign = isPos ? "+" : isNeg ? "−" : "";
	const pctStr = pct != null ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : null;

	return (
		<Box
			sx={{
				display: "inline-flex",
				flexDirection: "column",
				alignItems: "flex-end",
				bgcolor: `${accent}18`,
				borderRadius: "6px",
				px: 1,
				py: 0.4,
				minWidth: 80,
			}}
		>
			<Typography
				sx={{ fontSize: "0.8rem", fontWeight: 700, color: accent, lineHeight: 1.3 }}
			>
				{sign}{absRupee}
			</Typography>
			{pctStr && (
				<Typography
					sx={{ fontSize: "0.68rem", fontWeight: 600, color: accent, lineHeight: 1.2, opacity: 0.85 }}
				>
					{pctStr}
				</Typography>
			)}
		</Box>
	);
}

// ─── Stock name cell ─────────────────────────────────────────────────────────
function StockNameCell({ name }) {
	return (
		<Box>
			<Typography
				sx={{ fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.3 }}
			>
				{name}
			</Typography>
			<Typography
				sx={{
					fontSize: "0.65rem",
					fontWeight: 600,
					color: "text.secondary",
					letterSpacing: "0.06em",
					lineHeight: 1,
					mt: 0.2,
				}}
			>
				NSE
			</Typography>
		</Box>
	);
}

function StockTableRow({
	stock,
	activeTab,
	historyByStockId,
	activeStockMetrics,
	liveData,
	onAdd,
	onSell,
	onViewHistory,
	onChart,
	onDelete,
}) {
	const theme = useTheme();
	const handleAdd = useCallback(() => onAdd(stock), [onAdd, stock]);
	const handleViewHistory = useCallback(
		() => onViewHistory(stock),
		[onViewHistory, stock],
	);
	const handleChart = useCallback(() => onChart(stock), [onChart, stock]);
	const handleDelete = useCallback(() => onDelete(stock), [onDelete, stock]);
	const handleSell = useCallback(() => onSell(stock._id), [onSell, stock._id]);

	const rupee = (num) =>
		typeof num === "number" && !isNaN(num)
			? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
			: "—";

	const dormantMetrics = useMemo(
		() =>
			activeTab === 1
				? computeDormantMetrics(historyByStockId[stock._id] || [])
				: null,
		[activeTab, historyByStockId, stock._id],
	);

	const activeMetrics = useMemo(() => {
		if (activeTab === 1) return null;
		const metrics = activeStockMetrics[stock._id];
		const totalInvested = metrics ? metrics.totalInvested : 0;
		const avgPrice = metrics ? metrics.avgPrice : stock.avgPrice;
		const ltp = liveData?.ltp ?? null;
		const currVal = ltp !== null && stock.quantity > 0
			? parseFloat((stock.quantity * ltp).toFixed(2))
			: null;
		const pnl = ltp !== null
			? parseFloat(((ltp - avgPrice) * stock.quantity).toFixed(2))
			: null;
		const pct = ltp !== null && avgPrice > 0
			? ((ltp - avgPrice) / avgPrice) * 100
			: null;
		return { totalInvested, currVal, pnl, pct, avgPrice, ltp };
	}, [activeTab, stock, activeStockMetrics, liveData]);

	if (activeTab === 1 && dormantMetrics) {
		const {
			totalSoldQty,
			totalSoldCost,
			totalSellValue,
			totalPnl,
			avgBuyPrice,
			avgSellPrice,
		} = dormantMetrics;

		const dormantPct = totalSoldCost > 0 ? (totalPnl / totalSoldCost) * 100 : null;

		return (
			<TableRow hover sx={{ "& td": { py: 1.2 } }}>
				<TableCell><StockNameCell name={stock.stockName} /></TableCell>
				<TableCell align="right">{totalSoldQty}</TableCell>
				<TableCell align="right">{rupee(avgBuyPrice)}</TableCell>
				<TableCell align="right">{rupee(totalSoldCost)}</TableCell>
				<TableCell align="right">{rupee(avgSellPrice)}</TableCell>
				<TableCell align="right">{rupee(totalSellValue)}</TableCell>
				<TableCell align="right">
					<PnlBadge pnl={totalPnl} pct={dormantPct} theme={theme} />
				</TableCell>
				<TableCell align="center">
					<StockActions
						onAdd={handleAdd}
						onSell={null}
						onViewHistory={handleViewHistory}
						onDelete={handleDelete}
						canSell={false}
					/>
				</TableCell>
			</TableRow>
		);
	}

	const { totalInvested, currVal, pnl, pct, avgPrice, ltp } = activeMetrics;

	return (
		<TableRow hover sx={{ "& td": { py: 1.2 } }}>
			<TableCell><StockNameCell name={stock.stockName} /></TableCell>
			<TableCell align="right">{stock.quantity}</TableCell>
			<TableCell align="right">{rupee(avgPrice)}</TableCell>
			<TableCell align="right">{rupee(totalInvested)}</TableCell>
			<TableCell align="right">{ltp !== null ? rupee(ltp) : "—"}</TableCell>
			<TableCell align="right">{currVal !== null ? rupee(currVal) : "—"}</TableCell>
			<TableCell align="right">
				{pnl !== null
					? <PnlBadge pnl={pnl} pct={pct} theme={theme} />
					: <Typography sx={{ fontSize: "0.875rem", color: "text.disabled" }}>—</Typography>
				}
			</TableCell>
			<TableCell align="center">
				<StockActions
					onAdd={handleAdd}
					onSell={handleSell}
					onViewHistory={handleViewHistory}
					onChart={handleChart}
					onDelete={handleDelete}
					canSell={stock.quantity > 0}
				/>
			</TableCell>
		</TableRow>
	);
}

StockTableRow.propTypes = {
	stock: PropTypes.shape({
		_id: PropTypes.string.isRequired,
		stockName: PropTypes.string.isRequired,
		quantity: PropTypes.number.isRequired,
		avgPrice: PropTypes.number.isRequired,
	}).isRequired,
	activeTab: PropTypes.number.isRequired,
	historyByStockId: PropTypes.object.isRequired,
	activeStockMetrics: PropTypes.object.isRequired,
	liveData: PropTypes.shape({ ltp: PropTypes.number, cp: PropTypes.number }),
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

const MemoizedStockTableRow = memo(StockTableRow);
export default MemoizedStockTableRow;
