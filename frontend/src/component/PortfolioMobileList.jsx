/* eslint-disable react/prop-types */
import { memo, useCallback, useState, Fragment } from "react";
import {
	Box,
	Paper,
	Typography,
	Divider,
	SwipeableDrawer,
	Button,
	useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import BarChartIcon from "@mui/icons-material/BarChart";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

const rupee = (num, decimals = 2) =>
	typeof num === "number" && !isNaN(num)
		? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`
		: "—";

const pct = (num) =>
	typeof num === "number" && !isNaN(num)
		? `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`
		: null;

// ─── Single stock row (Zerodha-style 3-line layout) ──────────────────────────

function ActiveStockRow({ stock, activeStockMetrics, ltpMap, onTap }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const metrics = activeStockMetrics[stock._id];
	const totalInvested = metrics?.totalInvested ?? 0;
	const avgPrice = metrics?.avgPrice ?? stock.avgPrice;
	const live = ltpMap[stock.stockName];
	const ltp = live?.ltp ?? null;
	const cp = live?.cp ?? null;

	const pnl = ltp !== null ? (ltp - avgPrice) * stock.quantity : null;
	const pnlPct = ltp !== null && avgPrice > 0
		? ((ltp - avgPrice) / avgPrice) * 100
		: null;
	const dayChangePct = ltp !== null && cp != null && cp > 0
		? ((ltp - cp) / cp) * 100
		: null;

	const pnlColor = pnl === null ? "text.secondary" : pnl > 0 ? green : pnl < 0 ? red : "text.secondary";

	return (
		<Box
			onClick={onTap}
			sx={{
				px: 2,
				py: 1.5,
				cursor: "pointer",
				userSelect: "none",
				"&:active": { bgcolor: "action.hover" },
				transition: "background-color 0.1s",
			}}
		>
			{/* Line 1: qty + avg  |  P&L % */}
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					Qty. {stock.quantity}&nbsp;&nbsp;•&nbsp;&nbsp;Avg. {rupee(avgPrice)}
				</Typography>
				<Typography sx={{ fontSize: "0.72rem", fontWeight: 500, color: pnlColor }}>
					{pct(pnlPct) ?? "—"}
				</Typography>
			</Box>

			{/* Line 2: stock name  |  P&L absolute */}
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
				<Typography sx={{ fontSize: "0.98rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
					{stock.stockName}
				</Typography>
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: pnlColor }}>
					{pnl !== null ? rupee(pnl) : "—"}
				</Typography>
			</Box>

			{/* Line 3: invested  |  LTP + day% */}
			<Box sx={{ display: "flex", justifyContent: "space-between" }}>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					Invested {rupee(totalInvested, 0)}
				</Typography>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					LTP {ltp !== null ? rupee(ltp) : "—"}
					{dayChangePct !== null && (
						<Box
							component="span"
							sx={{ color: dayChangePct >= 0 ? green : red, ml: 0.5 }}
						>
							({pct(dayChangePct)})
						</Box>
					)}
				</Typography>
			</Box>
		</Box>
	);
}

function DormantStockRow({ stock, historyByStockId, onTap }) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const d = computeDormantMetrics(historyByStockId[stock._id] || []);
	const pnlColor = d.totalPnl > 0 ? green : d.totalPnl < 0 ? red : "text.secondary";
	const pnlPct =
		d.avgBuyPrice > 0
			? ((d.avgSellPrice - d.avgBuyPrice) / d.avgBuyPrice) * 100
			: null;

	return (
		<Box
			onClick={onTap}
			sx={{
				px: 2,
				py: 1.5,
				cursor: "pointer",
				userSelect: "none",
				"&:active": { bgcolor: "action.hover" },
				transition: "background-color 0.1s",
			}}
		>
			{/* Line 1: qty + avg buy  |  P&L % */}
			<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					Qty. {d.totalSoldQty}&nbsp;&nbsp;•&nbsp;&nbsp;Avg. {rupee(d.avgBuyPrice)}
				</Typography>
				<Typography sx={{ fontSize: "0.72rem", fontWeight: 500, color: pnlColor }}>
					{pct(pnlPct) ?? "—"}
				</Typography>
			</Box>

			{/* Line 2: stock name  |  P&L absolute */}
			<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.25 }}>
				<Typography sx={{ fontSize: "0.98rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
					{stock.stockName}
				</Typography>
				<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: pnlColor }}>
					{rupee(d.totalPnl)}
				</Typography>
			</Box>

			{/* Line 3: invested  |  sold at */}
			<Box sx={{ display: "flex", justifyContent: "space-between" }}>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					Invested {rupee(d.totalSoldCost, 0)}
				</Typography>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
					Sold at {rupee(d.avgSellPrice)}
				</Typography>
			</Box>
		</Box>
	);
}

// ─── Bottom action sheet ──────────────────────────────────────────────────────

function ActionSheet({
	stock,
	activeTab,
	ltpMap,
	onClose,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	const theme = useTheme();
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const isActive = activeTab === 0;
	const live = stock ? ltpMap[stock?.stockName] : null;
	const ltp = live?.ltp ?? null;
	const cp = live?.cp ?? null;
	const dayChange = ltp !== null && cp !== null ? ltp - cp : null;
	const dayChangePct = dayChange !== null && cp > 0 ? (dayChange / cp) * 100 : null;
	const dayColor = dayChange === null ? "text.secondary" : dayChange >= 0 ? green : red;

	const handleAdd = useCallback(() => { onClose(); onAdd(stock); }, [onClose, onAdd, stock]);
	const handleSell = useCallback(() => { onClose(); onSell(stock._id); }, [onClose, onSell, stock]);
	const handleHistory = useCallback(() => { onClose(); onViewHistory(stock); }, [onClose, onViewHistory, stock]);
	const handleDelete = useCallback(() => { onClose(); onDelete(stock); }, [onClose, onDelete, stock]);

	return (
		<SwipeableDrawer
			anchor="bottom"
			open={!!stock}
			onClose={onClose}
			onOpen={() => {}}
			disableSwipeToOpen
			PaperProps={{
				sx: {
					borderRadius: "16px 16px 0 0",
					px: 2,
					pt: 1,
					pb: 3,
					maxWidth: 600,
					mx: "auto",
					left: 0,
					right: 0,
				},
			}}
		>
			{/* Drag handle */}
			<Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
				<Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider" }} />
			</Box>

			{/* Stock info */}
			<Box sx={{ mb: 2 }}>
				<Typography variant="h6" fontWeight={700} letterSpacing="-0.01em">
					{stock?.stockName}
				</Typography>
				{isActive && ltp !== null && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
						<Typography variant="body2" color="text.secondary">NSE</Typography>
						<Typography variant="body2" fontWeight={600} sx={{ color: dayColor }}>
							{rupee(ltp)}
						</Typography>
						{dayChange !== null && (
							<Typography variant="body2" sx={{ color: dayColor }}>
								{dayChange >= 0 ? "+" : ""}{rupee(dayChange)} ({pct(dayChangePct)})
							</Typography>
						)}
					</Box>
				)}
				{isActive && ltp === null && (
					<Typography variant="body2" color="text.secondary">NSE · price unavailable</Typography>
				)}
			</Box>

			<Divider sx={{ mb: 2 }} />

			{/* Primary actions */}
			<Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
				<Button
					fullWidth
					variant="contained"
					color="secondary"
					size="large"
					startIcon={<AddIcon />}
					onClick={handleAdd}
					sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
				>
					Add
				</Button>
				{isActive && (
					<Button
						fullWidth
						variant="contained"
						color="primary"
						size="large"
						startIcon={<RemoveIcon />}
						onClick={handleSell}
						sx={{ borderRadius: 2, py: 1.25, fontWeight: 700 }}
					>
						Sell
					</Button>
				)}
			</Box>

			{/* Secondary actions */}
			<Box sx={{ display: "flex", gap: 1.5 }}>
				<Button
					fullWidth
					variant="outlined"
					color="secondary"
					size="large"
					startIcon={<BarChartIcon />}
					onClick={handleHistory}
					sx={{ borderRadius: 2, py: 1.25 }}
				>
					History
				</Button>
				<Button
					fullWidth
					variant="outlined"
					color="error"
					size="large"
					startIcon={<DeleteOutlineIcon />}
					onClick={handleDelete}
					sx={{ borderRadius: 2, py: 1.25 }}
				>
					Delete
				</Button>
			</Box>
		</SwipeableDrawer>
	);
}

// ─── Main list ────────────────────────────────────────────────────────────────

function PortfolioMobileList({
	stocks,
	activeTab,
	historyByStockId,
	activeStockMetrics,
	ltpMap,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	const [selectedStock, setSelectedStock] = useState(null);

	if (stocks.length === 0) {
		return (
			<Paper elevation={1} sx={{ mb: 4, p: 3, textAlign: "center", borderRadius: 2 }}>
				<Typography variant="h6" color="text.secondary" gutterBottom>
					{activeTab === 0 ? "No active stocks in your portfolio" : "No dormant stocks"}
				</Typography>
				<Typography variant="body2" color="text.secondary">
					{activeTab === 0
						? "Start by adding a stock to track your investments"
						: "Stocks become dormant when you sell all shares"}
				</Typography>
			</Paper>
		);
	}

	return (
		<>
			<Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
				{stocks.map((stock, i) => (
					<Fragment key={stock._id}>
						{activeTab === 0 ? (
							<ActiveStockRow
								stock={stock}
								activeStockMetrics={activeStockMetrics}
								ltpMap={ltpMap}
								onTap={() => setSelectedStock(stock)}
							/>
						) : (
							<DormantStockRow
								stock={stock}
								historyByStockId={historyByStockId}
								onTap={() => setSelectedStock(stock)}
							/>
						)}
						{i < stocks.length - 1 && <Divider />}
					</Fragment>
				))}
			</Paper>

			<ActionSheet
				stock={selectedStock}
				activeTab={activeTab}
				activeStockMetrics={activeStockMetrics}
				ltpMap={ltpMap}
				onClose={() => setSelectedStock(null)}
				onAdd={onAdd}
				onSell={onSell}
				onViewHistory={onViewHistory}
				onDelete={onDelete}
			/>
		</>
	);
}

const MemoizedPortfolioMobileList = memo(PortfolioMobileList);
export default MemoizedPortfolioMobileList;
