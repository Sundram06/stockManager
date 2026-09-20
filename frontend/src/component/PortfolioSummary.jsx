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
	portfolioTotals,
} from "../util/portfolioMetrics.mjs";
import { percent, rupee } from "../util/format.mjs";
import { useMarketPrices } from "../context/MarketDataContext";

const STALE = 60_000;
const GC = 5 * 60_000;

const fmt = (value) => rupee(value, { decimals: 0, absolute: true });
const fmtPct = percent;

// ─── Shared card shell ───────────────────────────────────────────────────────
function SummaryCard({ accentColor, children, sx = {} }) {
	const theme = useTheme();
	return (
		<Box
			sx={{
				bgcolor: "background.elevated",
				border: `1px solid ${theme.palette.divider}`,
				borderLeft: `3px solid ${accentColor ?? theme.palette.primary.main}`,
				borderRadius: "12px",
				px: { xs: 1.5, sm: 2 },
				py: { xs: 1.25, sm: 1.75 },
				display: "flex",
				flexDirection: "column",
				gap: { xs: 0.5, sm: 0.75 },
				transition: "box-shadow 0.2s",
				"&:hover": {
					boxShadow: `0 0 0 1px ${(accentColor ?? theme.palette.primary.main)}40, 0 2px 8px rgba(0,0,0,0.25)`,
				},
				...sx,
			}}
		>
			{children}
		</Box>
	);
}

// ─── Uppercase micro-label ───────────────────────────────────────────────────
function CardLabel({ children }) {
	return (
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
			{children}
		</Typography>
	);
}

// ─── Value card (Invested / Current Value / P&L / Day Change) ───────────────
function ValueCard({ label, value, prefix, accent, isPnl }) {
	return (
		<SummaryCard accentColor={accent}>
			<CardLabel>{label}</CardLabel>
			<Box sx={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
				{prefix && (
					<Typography
						sx={{
							fontSize: "0.85rem",
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
						fontSize: { xs: "0.95rem", sm: "1.15rem" },
						fontWeight: 700,
						color: isPnl ? accent : "text.primary",
						lineHeight: 1.2,
						fontVariantNumeric: "tabular-nums",
						letterSpacing: "-0.01em",
					}}
				>
					{value}
				</Typography>
			</Box>
		</SummaryCard>
	);
}

// ─── Stock card (Best / Worst performer) ────────────────────────────────────
// Colour and arrow follow the stock's own return. In a portfolio where
// everything is down, the best performer is still a loss and must read as one.
function StockCard({ label, stock, accent }) {
	const Icon = (stock?.pct ?? 0) >= 0 ? TrendingUpIcon : TrendingDownIcon;

	return (
		<SummaryCard accentColor={accent}>
			<CardLabel>{label}</CardLabel>
			{stock ? (
				<>
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
						<Icon sx={{ fontSize: "0.9rem", color: accent, flexShrink: 0 }} />
						<Typography
							sx={{
								fontSize: { xs: "0.8rem", sm: "0.95rem" },
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
							fontSize: "0.72rem",
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
		</SummaryCard>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PortfolioSummary() {
	const { ltpMap } = useMarketPrices();
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

	const summary = useMemo(
		() => portfolioTotals({ stocks, activeStockMetrics, ltpMap }),
		[stocks, activeStockMetrics, ltpMap],
	);

	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const teal = theme.palette.primary.main;

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
				gap: { xs: 1, sm: 1.25 },
				mb: { xs: 1.5, sm: 2 },
			}}
		>
			<ValueCard
				label="Total Invested"
				value={fmt(summary.totalInvested)}
				accent={teal}
			/>
			<ValueCard
				label="Current Value"
				value={summary.currentValue !== null ? fmt(summary.currentValue) : "—"}
				accent={teal}
			/>
			<ValueCard
				label="Unrealized P&L"
				value={summary.unrealizedPnl !== null ? fmt(summary.unrealizedPnl) : "—"}
				prefix={
					summary.unrealizedPnl !== null
						? summary.unrealizedPnl >= 0 ? "+" : "−"
						: ""
				}
				accent={pnlAccent(summary.unrealizedPnl)}
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
			<StockCard label="Best Performer" stock={summary.best} accent={pnlAccent(summary.best?.pct)} />
			<StockCard label="Worst Performer" stock={summary.worst} accent={pnlAccent(summary.worst?.pct)} />
		</Box>
	);
}
