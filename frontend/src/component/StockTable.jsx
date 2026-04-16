import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TableSortLabel,
	Typography,
	Box,
	useTheme,
} from "@mui/material";
import { memo, useMemo, useState } from "react";
import StockTableRow from "./StockTableRow";
import PropTypes from "prop-types";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

// ─── Column definitions per tab ─────────────────────────────────────────────

const ACTIVE_COLS = [
	{ id: "name",     label: "Stock",         align: "left"   },
	{ id: "qty",      label: "Quantity",       align: "right"  },
	{ id: "avgPrice", label: "Avg. Buy Price", align: "right"  },
	{ id: "invested", label: "Total Invested", align: "right"  },
	{ id: "ltp",      label: "LTP",            align: "right"  },
	{ id: "currVal",  label: "Current Value",  align: "right"  },
	{ id: "pnl",      label: "P&L",            align: "right"  },
];

const DORMANT_COLS = [
	{ id: "name",      label: "Stock",           align: "left"  },
	{ id: "qty",       label: "Qty Sold",         align: "right" },
	{ id: "avgPrice",  label: "Avg. Buy Price",   align: "right" },
	{ id: "invested",  label: "Total Invested",   align: "right" },
	{ id: "sellPrice", label: "Avg. Sell Price",  align: "right" },
	{ id: "sellVal",   label: "Sell Value",       align: "right" },
	{ id: "pnl",       label: "P&L",              align: "right" },
];

// Null values always sort to the bottom regardless of direction
const nullLast = (val, dir) =>
	val === null || val === undefined
		? dir === "asc" ? Infinity : -Infinity
		: val;

// ─── Column widths ───────────────────────────────────────────────────────────
const COL_WIDTHS = {
	name:      "20%",
	qty:       "7%",
	avgPrice:  "11%",
	invested:  "12%",
	ltp:       "9%",
	currVal:   "12%",
	sellPrice: "11%",
	sellVal:   "12%",
	pnl:       "11%",
	actions:   "88px",
};

// ─── Component ───────────────────────────────────────────────────────────────

function StockTable({
	stocks,
	activeTab,
	historyByStockId,
	activeStockMetrics,
	ltpMap,
	onAdd,
	onSell,
	onViewHistory,
	onChart,
	onDelete,
}) {
	// Per-tab sort state: { [tab]: { col, dir } }
	const [sortByTab, setSortByTab] = useState({
		0: { col: "name", dir: "asc" },
		1: { col: "name", dir: "asc" },
	});

	const { col, dir } = sortByTab[activeTab] ?? { col: "name", dir: "asc" };

	const handleSort = (newCol) => {
		setSortByTab((prev) => {
			const current = prev[activeTab];
			const newDir =
				current.col === newCol && current.dir === "asc" ? "desc" : "asc";
			return { ...prev, [activeTab]: { col: newCol, dir: newDir } };
		});
	};

	// Pre-compute dormant metrics for all stocks when on dormant tab
	const dormantMetricsMap = useMemo(() => {
		if (activeTab !== 1) return {};
		const map = {};
		for (const stock of stocks) {
			map[stock._id] = computeDormantMetrics(historyByStockId[stock._id] || []);
		}
		return map;
	}, [activeTab, stocks, historyByStockId]);

	const getSortValue = (stock, colId) => {
		if (activeTab === 0) {
			const metrics = activeStockMetrics[stock._id];
			const live = ltpMap[stock.stockName];
			const avgPrice = metrics?.avgPrice ?? stock.avgPrice;
			const ltp = live?.ltp ?? null;
			switch (colId) {
				case "name":     return stock.stockName;
				case "qty":      return stock.quantity;
				case "avgPrice": return avgPrice;
				case "invested": return metrics?.totalInvested ?? 0;
				case "ltp":      return nullLast(ltp, dir);
				case "currVal":  return nullLast(ltp !== null ? ltp * stock.quantity : null, dir);
				case "pnl":      return nullLast(ltp !== null ? (ltp - avgPrice) * stock.quantity : null, dir);
				default:         return stock.stockName;
			}
		} else {
			const d = dormantMetricsMap[stock._id] ?? {};
			switch (colId) {
				case "name":      return stock.stockName;
				case "qty":       return d.totalSoldQty ?? 0;
				case "avgPrice":  return d.avgBuyPrice ?? 0;
				case "invested":  return d.totalSoldCost ?? 0;
				case "sellPrice": return d.avgSellPrice ?? 0;
				case "sellVal":   return d.totalSellValue ?? 0;
				case "pnl":       return d.totalPnl ?? 0;
				default:          return stock.stockName;
			}
		}
	};

	const sortedStocks = useMemo(() => {
		return [...stocks].sort((a, b) => {
			const aVal = getSortValue(a, col);
			const bVal = getSortValue(b, col);
			if (typeof aVal === "string") {
				return dir === "asc"
					? aVal.localeCompare(bVal)
					: bVal.localeCompare(aVal);
			}
			return dir === "asc" ? aVal - bVal : bVal - aVal;
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stocks, col, dir, activeTab, activeStockMetrics, ltpMap, dormantMetricsMap]);

	const cols = activeTab === 0 ? ACTIVE_COLS : DORMANT_COLS;
	const theme = useTheme();
	const stickyHeaderBg = theme.palette.background.paper;

	return (
		<TableContainer sx={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
			<Table stickyHeader size="small">
				<TableHead>
					<TableRow>
						{cols.map((c) => (
							<TableCell
								key={c.id}
								align={c.align}
								sortDirection={col === c.id ? dir : false}
								sx={{
									fontWeight: 700,
									whiteSpace: "nowrap",
									fontSize: "0.72rem",
									letterSpacing: "0.06em",
									textTransform: "uppercase",
									color: "text.secondary",
									bgcolor: stickyHeaderBg,
									borderBottom: `2px solid ${theme.palette.divider}`,
									width: COL_WIDTHS[c.id],
									py: 1.25,
								}}
							>
								<TableSortLabel
									active={col === c.id}
									direction={col === c.id ? dir : "asc"}
									onClick={() => handleSort(c.id)}
								>
									{c.label}
								</TableSortLabel>
							</TableCell>
						))}
						<TableCell
							align="center"
							sx={{
								fontWeight: 700,
								fontSize: "0.72rem",
								letterSpacing: "0.06em",
								textTransform: "uppercase",
								color: "text.secondary",
								bgcolor: stickyHeaderBg,
								borderBottom: `2px solid ${theme.palette.divider}`,
								width: COL_WIDTHS.actions,
								py: 1.25,
							}}
						>
							Actions
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{sortedStocks.length === 0 ? (
						<TableRow>
							<TableCell colSpan={cols.length + 1} align="center">
								<Box sx={{ py: 4, textAlign: "center" }}>
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
								</Box>
							</TableCell>
						</TableRow>
					) : (
						sortedStocks.map((stock) => (
							<StockTableRow
								key={stock._id}
								stock={stock}
								activeTab={activeTab}
								historyByStockId={historyByStockId}
								activeStockMetrics={activeStockMetrics}
								liveData={ltpMap[stock.stockName] ?? null}
								onAdd={onAdd}
								onSell={onSell}
								onViewHistory={onViewHistory}
								onChart={onChart}
								onDelete={onDelete}
							/>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

StockTable.propTypes = {
	stocks: PropTypes.arrayOf(PropTypes.object).isRequired,
	activeTab: PropTypes.number.isRequired,
	historyByStockId: PropTypes.object.isRequired,
	activeStockMetrics: PropTypes.object.isRequired,
	ltpMap: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onChart: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

const MemoizedStockTable = memo(StockTable);
export default MemoizedStockTable;
