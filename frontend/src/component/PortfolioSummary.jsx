/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, useTheme } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { fetchStocks } from "../util/api/stocks.mjs";
import { fetchStockHistoryById } from "../util/api/history.mjs";
import {
	groupHistoryByStockId,
	computeActiveStockMetrics,
} from "../util/portfolioMetrics.mjs";

const STALE = 60_000;
const GC = 5 * 60_000;

const fmt = (num) =>
	typeof num === "number" && !isNaN(num)
		? `₹${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
		: "—";

const fmtPct = (num) =>
	typeof num === "number" && !isNaN(num)
		? `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`
		: null;

// ─── Value card (Invested / Current Value / P&L / Day Change) ───────────────
function ValueCard({ label, value, prefix, accent, isPnl }) {
	return (
		<Box
			sx={{
				bgcolor: "background.paper",
				borderLeft: `3px solid ${accent}`,
				borderRadius: "0 8px 8px 0",
				px: { xs: 1, sm: 2 },
				py: { xs: 0.75, sm: 1.5 },
				display: "flex",
				flexDirection: "column",
				gap: { xs: 0.35, sm: 0.6 },
				boxShadow: 1,
				...(isPnl && {
					background: `linear-gradient(135deg, ${accent}0d 0%, transparent 55%)`,
				}),
				transition: "box-shadow 0.2s",
				"&:hover": { boxShadow: 3 },
			}}
		>
			<Typography
				sx={{
					fontSize: "0.6rem",
					fontWeight: 700,
					letterSpacing: "0.09em",
					color: "text.secondary",
					textTransform: "uppercase",
					lineHeight: 1,
				}}
			>
				{label}
			</Typography>
			<Box sx={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
				{prefix && (
					<Typography
						sx={{
							fontSize: "0.8rem",
							fontWeight: 700,
							color: isPnl ? accent : "text.primary",
							lineHeight: 1,
						}}
					>
						{prefix}
					</Typography>
				)}
				<Typography
					sx={{
						fontSize: { xs: "0.82rem", sm: "1.05rem" },
						fontWeight: 700,
						color: isPnl ? accent : "text.primary",
						lineHeight: 1.2,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{value}
				</Typography>
			</Box>
		</Box>
	);
}

// ─── Stock card (Best / Worst performer) ────────────────────────────────────
function StockCard({ label, stock, accent, isBest }) {
	const Icon = isBest ? TrendingUpIcon : TrendingDownIcon;

	return (
		<Box
			sx={{
				bgcolor: "background.paper",
				borderLeft: `3px solid ${accent}`,
				borderRadius: "0 8px 8px 0",
				px: { xs: 1, sm: 2 },
				py: { xs: 0.75, sm: 1.5 },
				display: "flex",
				flexDirection: "column",
				gap: { xs: 0.35, sm: 0.6 },
				boxShadow: 1,
				background: `linear-gradient(135deg, ${accent}0d 0%, transparent 55%)`,
				transition: "box-shadow 0.2s",
				"&:hover": { boxShadow: 3 },
			}}
		>
			<Typography
				sx={{
					fontSize: "0.6rem",
					fontWeight: 700,
					letterSpacing: "0.09em",
					color: "text.secondary",
					textTransform: "uppercase",
					lineHeight: 1,
				}}
			>
				{label}
			</Typography>
			{stock ? (
				<>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
						<Icon sx={{ fontSize: "0.9rem", color: accent, flexShrink: 0 }} />
						<Typography
							sx={{
								fontSize: { xs: "0.76rem", sm: "0.95rem" },
								fontWeight: 700,
								color: "text.primary",
								lineHeight: 1.2,
								letterSpacing: "-0.01em",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{stock.name}
						</Typography>
					</Box>
					<Typography
						sx={{
							fontSize: "0.7rem",
							fontWeight: 600,
							color: accent,
							lineHeight: 1,
						}}
					>
						{fmtPct(stock.pct)}
						{stock.pnl != null ? ` · ${fmt(stock.pnl)}` : ""}
					</Typography>
				</>
			) : (
				<Typography sx={{ fontSize: "1rem", fontWeight: 700, color: "text.disabled" }}>
					—
				</Typography>
			)}
		</Box>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PortfolioSummary({ ltpMap }) {
	const theme = useTheme();

	const { data: stocks = [] } = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		staleTime: STALE,
		gcTime: GC,
		refetchOnWindowFocus: false,
	});

	const { data: historyRows = [] } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
		staleTime: STALE,
		gcTime: GC,
		refetchOnWindowFocus: false,
	});

	const historyByStockId = useMemo(
		() => groupHistoryByStockId(historyRows),
		[historyRows],
	);

	const activeStockMetrics = useMemo(
		() => computeActiveStockMetrics(stocks, historyByStockId),
		[stocks, historyByStockId],
	);

	const summary = useMemo(() => {
		const activeStocks = stocks.filter((s) => s.quantity > 0);

		let totalInvested = 0;
		let currentValue = 0;
		let dayChange = 0;
		let hasLiveData = false;

		let bestStock = null;
		let worstStock = null;
		let bestPct = -Infinity;
		let worstPct = Infinity;

		for (const stock of activeStocks) {
			const metrics = activeStockMetrics[stock._id];
			if (metrics) totalInvested += metrics.totalInvested;

			const live = ltpMap[stock.stockName];
			if (live?.ltp != null) {
				hasLiveData = true;
				currentValue += live.ltp * stock.quantity;
				if (live.cp != null) dayChange += (live.ltp - live.cp) * stock.quantity;

				const avgPrice = metrics?.avgPrice ?? stock.avgPrice;
				if (avgPrice > 0) {
					const pct = ((live.ltp - avgPrice) / avgPrice) * 100;
					const pnl = (live.ltp - avgPrice) * stock.quantity;
					if (pct > bestPct) { bestPct = pct; bestStock = { name: stock.stockName, pct, pnl }; }
					if (pct < worstPct) { worstPct = pct; worstStock = { name: stock.stockName, pct, pnl }; }
				}
			}
		}

		return {
			totalInvested,
			currentValue: hasLiveData ? currentValue : null,
			unrealizedPnL: hasLiveData ? currentValue - totalInvested : null,
			dayChange: hasLiveData ? dayChange : null,
			bestStock,
			worstStock,
		};
	}, [stocks, activeStockMetrics, ltpMap]);

	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const orange = theme.palette.primary.main;

	const pnlAccent = (val) => {
		if (val === null || val === undefined) return theme.palette.text.disabled;
		return val > 0 ? green : val < 0 ? red : theme.palette.text.secondary;
	};

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: {
					xs: "repeat(2, 1fr)",
					sm: "repeat(3, 1fr)",
					lg: "repeat(6, 1fr)",
				},
				gap: { xs: 0.75, sm: 1.5 },
				mb: { xs: 1.5, sm: 2.5 },
			}}
		>
			<ValueCard
				label="Total Invested"
				value={fmt(summary.totalInvested)}
				accent={orange}
			/>
			<ValueCard
				label="Current Value"
				value={summary.currentValue !== null ? fmt(summary.currentValue) : "—"}
				accent={orange}
			/>
			<ValueCard
				label="Unrealized P&L"
				value={summary.unrealizedPnL !== null ? fmt(summary.unrealizedPnL) : "—"}
				prefix={
					summary.unrealizedPnL !== null
						? summary.unrealizedPnL >= 0 ? "+" : "−"
						: ""
				}
				accent={pnlAccent(summary.unrealizedPnL)}
				isPnl
			/>
			<ValueCard
				label="Day Change"
				value={summary.dayChange !== null ? fmt(summary.dayChange) : "—"}
				prefix={
					summary.dayChange !== null
						? summary.dayChange >= 0 ? "+" : "−"
						: ""
				}
				accent={pnlAccent(summary.dayChange)}
				isPnl
			/>
			<StockCard
				label="Best Performer"
				stock={summary.bestStock}
				accent={green}
				isBest
			/>
			<StockCard
				label="Worst Performer"
				stock={summary.worstStock}
				accent={red}
				isBest={false}
			/>
		</Box>
	);
}
