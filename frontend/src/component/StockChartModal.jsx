/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import {
	ComposedChart,
	Area,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	ReferenceDot,
} from "recharts";
import {
	Modal,
	Box,
	Typography,
	IconButton,
	Divider,
	Button,
	useTheme,
	useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

// ─── Constants ────────────────────────────────────────────────────────────────
const RANGES = [
	{ label: "1W", days: 7 },
	{ label: "1M", days: 30 },
	{ label: "3M", days: 90 },
	{ label: "6M", days: 180 },
	{ label: "1Y", days: 365 },
	{ label: "ALL", days: 9999 },
];

// ─── Mock price data generator ────────────────────────────────────────────────
// Uses stock name as seed so the chart looks consistent on re-renders.
function seededRandom(seed) {
	let s = seed;
	return () => {
		s = (s * 1664525 + 1013904223) & 0xffffffff;
		return (s >>> 0) / 0xffffffff;
	};
}

function generateMockPriceData(stockName, basePrice, endPrice, totalDays = 365) {
	const rand = seededRandom(
		stockName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0),
	);
	const data = [];
	const start = new Date();
	start.setDate(start.getDate() - totalDays);

	let price = basePrice;
	const drift = endPrice != null ? Math.log(endPrice / basePrice) / totalDays : 0;

	for (let i = 0; i <= totalDays; i++) {
		const d = new Date(start);
		d.setDate(start.getDate() + i);
		if (d.getDay() === 0 || d.getDay() === 6) continue;
		const daily = drift + (rand() - 0.48) * 0.03;
		price = Math.max(price * (1 + daily), 1);
		data.push({
			date: d.toISOString().split("T")[0],
			price: Math.round(price * 100) / 100,
		});
	}
	return data;
}

// ─── Compute avg buy step line from history ───────────────────────────────────
function computeAvgBuySteps(history) {
	if (!history || history.length === 0) return [];
	const events = [];
	for (const row of history) {
		if (row.date) events.push({ date: row.date, qty: row.quantity, price: row.avgPrice, type: "buy" });
		if (row.dateSold && row.quantitySold > 0)
			events.push({ date: row.dateSold, qty: row.quantitySold, price: row.avgPrice, type: "sell" });
	}
	events.sort((a, b) => new Date(a.date) - new Date(b.date));

	let totalQty = 0;
	let totalCost = 0;
	const steps = [];

	for (const ev of events) {
		if (ev.type === "buy") {
			totalQty += ev.qty;
			totalCost += ev.qty * ev.price;
		} else {
			totalQty = Math.max(0, totalQty - ev.qty);
			totalCost = totalQty > 0 ? (totalCost - ev.qty * ev.price) : 0;
		}
		const avg = totalQty > 0 ? totalCost / totalQty : null;
		steps.push({ date: ev.date.split("T")[0], avgBuy: avg });
	}
	return steps;
}

// ─── Merge avg buy steps into price data ─────────────────────────────────────
function mergePriceWithAvgBuy(priceData, steps) {
	if (!steps.length) return priceData.map((d) => ({ ...d, avgBuy: null }));

	let currentAvg = null;
	let stepIdx = 0;
	return priceData.map((d) => {
		while (stepIdx < steps.length && steps[stepIdx].date <= d.date) {
			currentAvg = steps[stepIdx].avgBuy;
			stepIdx++;
		}
		return { ...d, avgBuy: currentAvg };
	});
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const rupee = (n, dec = 0) =>
	typeof n === "number" && !isNaN(n)
		? `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: dec })}`
		: "—";

const fmtAxisDate = (str) => {
	if (!str) return "";
	const d = new Date(str);
	return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, theme }) {
	if (!active || !payload?.length) return null;
	const price = payload.find((p) => p.dataKey === "price")?.value;
	const avg = payload.find((p) => p.dataKey === "avgBuy")?.value;
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const diff = price != null && avg != null ? price - avg : null;

	return (
		<Box
			sx={{
				bgcolor: "background.elevated",
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: "8px",
				px: 1.5,
				py: 1,
				minWidth: 160,
				boxShadow: 8,
			}}
		>
			<Typography sx={{ fontSize: "0.65rem", color: "text.secondary", mb: 0.5, letterSpacing: "0.05em" }}>
				{label ? new Date(label).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
			</Typography>
			{price != null && (
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Price</Typography>
					<Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: theme.palette.primary.main, fontVariantNumeric: "tabular-nums" }}>
						{rupee(price, 2)}
					</Typography>
				</Box>
			)}
			{avg != null && (
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Avg Buy</Typography>
					<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" }}>
						{rupee(avg, 2)}
					</Typography>
				</Box>
			)}
			{diff != null && (
				<Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mt: 0.25 }}>
					<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>P&L/share</Typography>
					<Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: diff >= 0 ? green : red, fontVariantNumeric: "tabular-nums" }}>
						{diff >= 0 ? "+" : "−"}{rupee(Math.abs(diff), 2)}
					</Typography>
				</Box>
			)}
		</Box>
	);
}

// ─── Time range pill selector ─────────────────────────────────────────────────
function RangePills({ selected, onChange, theme }) {
	return (
		<Box sx={{ display: "flex", gap: 0.5 }}>
			{RANGES.map((r) => {
				const isActive = selected === r.label;
				return (
					<Box
						key={r.label}
						onClick={() => onChange(r.label)}
						sx={{
							px: 1.25,
							py: 0.4,
							borderRadius: "6px",
							cursor: "pointer",
							bgcolor: isActive ? theme.palette.primary.main : "transparent",
							border: `1px solid ${isActive ? theme.palette.primary.main : theme.palette.divider}`,
							transition: "all 0.15s ease",
							"&:hover": { borderColor: theme.palette.primary.main },
						}}
					>
						<Typography
							sx={{
								fontSize: "0.7rem",
								fontWeight: 700,
								color: isActive ? "#fff" : theme.palette.text.secondary,
								lineHeight: 1,
								letterSpacing: "0.04em",
							}}
						>
							{r.label}
						</Typography>
					</Box>
				);
			})}
		</Box>
	);
}

// ─── Stat row inside holdings panel ──────────────────────────────────────────
function StatRow({ label, value, valueColor }) {
	return (
		<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", py: 0.5 }}>
			<Typography sx={{ fontSize: "0.68rem", color: "text.secondary", letterSpacing: "0.04em", textTransform: "uppercase" }}>
				{label}
			</Typography>
			<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: valueColor ?? "text.primary", fontVariantNumeric: "tabular-nums" }}>
				{value}
			</Typography>
		</Box>
	);
}

// ─── Holdings panel (active stocks) ──────────────────────────────────────────
function HoldingsPanel({ stock, metrics, ltp, onAddMore, onSell, theme }) {
	const avgPrice = metrics?.avgPrice ?? stock?.avgPrice ?? 0;
	const qty = stock?.quantity ?? 0;
	const totalInvested = metrics?.totalInvested ?? 0;
	const currentValue = ltp != null ? ltp * qty : null;
	const pnl = ltp != null ? (ltp - avgPrice) * qty : null;
	const pnlPct = ltp != null && avgPrice > 0 ? ((ltp - avgPrice) / avgPrice) * 100 : null;

	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const pnlColor = pnl === null ? "text.disabled" : pnl > 0 ? green : pnl < 0 ? red : "text.secondary";

	return (
		<Box
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				px: { xs: 2, sm: 2.5 },
				py: 2,
			}}
		>
			<Typography
				sx={{
					fontSize: "0.6rem",
					fontWeight: 700,
					letterSpacing: "0.1em",
					color: "text.secondary",
					textTransform: "uppercase",
					mb: 1.5,
				}}
			>
				Holdings
			</Typography>

			<StatRow label="Avg Buy Price" value={rupee(avgPrice, 2)} />
			<StatRow
				label="Current LTP"
				value={ltp != null ? rupee(ltp, 2) : "—"}
				valueColor={ltp != null ? theme.palette.primary.main : undefined}
			/>
			<StatRow label="Shares Held" value={qty} />

			<Divider sx={{ my: 1 }} />

			<StatRow label="Total Invested" value={rupee(totalInvested)} />
			<StatRow
				label="Current Value"
				value={currentValue != null ? rupee(currentValue) : "—"}
			/>

			<Divider sx={{ my: 1 }} />

			{/* P&L badge */}
			<Box
				sx={{
					mt: 0.5,
					mb: 2,
					p: 1.5,
					borderRadius: "10px",
					bgcolor: pnl != null ? `${pnlColor}18` : "action.hover",
					border: `1px solid ${pnl != null ? pnlColor + "40" : "transparent"}`,
					textAlign: "center",
				}}
			>
				<Typography sx={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase", mb: 0.4 }}>
					Unrealized P&amp;L
				</Typography>
				<Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: pnlColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
					{pnl != null ? `${pnl >= 0 ? "+" : "−"}${rupee(pnl)}` : "—"}
				</Typography>
				{pnlPct != null && (
					<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: pnlColor, opacity: 0.85 }}>
						{pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}% all time
					</Typography>
				)}
			</Box>

			{/* Action buttons */}
			<Box sx={{ mt: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
				<Button
					variant="contained"
					color="primary"
					startIcon={<AddIcon sx={{ fontSize: "0.9rem !important" }} />}
					onClick={onAddMore}
					sx={{ py: 1, fontWeight: 700, fontSize: "0.8rem", boxShadow: "none", "&:hover": { boxShadow: "none", filter: "brightness(0.9)" } }}
				>
					Buy More
				</Button>
				<Button
					variant="outlined"
					color="error"
					startIcon={<RemoveIcon sx={{ fontSize: "0.9rem !important" }} />}
					onClick={onSell}
					sx={{ py: 1, fontWeight: 700, fontSize: "0.8rem", borderWidth: "1.5px", "&:hover": { borderWidth: "1.5px" } }}
				>
					Sell Shares
				</Button>
			</Box>
		</Box>
	);
}

// ─── Trade summary panel (dormant stocks) ────────────────────────────────────
function TradeSummaryPanel({ stock, metrics, history, theme }) {
	const avgBuyPrice = metrics?.avgBuyPrice ?? stock?.avgPrice ?? 0;
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;

	const totals = useMemo(() => {
		if (!history?.length) return {};
		let soldQty = 0, soldAmt = 0, soldCost = 0, totalPnl = 0;
		for (const row of history) {
			const sq = row.quantitySold || 0;
			soldQty += sq;
			soldAmt += sq * (row.sellingPrice || 0);
			soldCost += sq * (row.avgPrice || 0);
			totalPnl += row.pnl || 0;
		}
		return {
			soldQty,
			totalInvested: soldCost,
			totalRealized: soldAmt,
			totalPnl,
			avgSell: soldQty > 0 ? soldAmt / soldQty : null,
			pnlPct: soldCost > 0 ? (totalPnl / soldCost) * 100 : null,
		};
	}, [history]);

	const pnlColor = totals.totalPnl > 0 ? green : totals.totalPnl < 0 ? red : "text.secondary";

	return (
		<Box sx={{ height: "100%", display: "flex", flexDirection: "column", px: { xs: 2, sm: 2.5 }, py: 2 }}>
			<Typography sx={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", color: "text.secondary", textTransform: "uppercase", mb: 1.5 }}>
				Trade Summary
			</Typography>

			<StatRow label="Avg Buy Price" value={rupee(avgBuyPrice, 2)} />
			<StatRow label="Exit Price" value={totals.avgSell != null ? rupee(totals.avgSell, 2) : "—"} valueColor={theme.palette.primary.main} />
			<StatRow label="Shares Traded" value={totals.soldQty ?? "—"} />

			<Divider sx={{ my: 1 }} />

			<StatRow label="Total Invested" value={rupee(totals.totalInvested)} />
			<StatRow label="Total Realized" value={rupee(totals.totalRealized)} />

			<Divider sx={{ my: 1 }} />

			<Box
				sx={{
					mt: 0.5,
					p: 1.5,
					borderRadius: "10px",
					bgcolor: totals.totalPnl != null ? `${pnlColor}18` : "action.hover",
					border: `1px solid ${totals.totalPnl != null ? pnlColor + "40" : "transparent"}`,
					textAlign: "center",
				}}
			>
				<Typography sx={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase", mb: 0.4 }}>
					Realized P&amp;L
				</Typography>
				<Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: pnlColor, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
					{totals.totalPnl != null ? `${totals.totalPnl >= 0 ? "+" : "−"}${rupee(totals.totalPnl)}` : "—"}
				</Typography>
				{totals.pnlPct != null && (
					<Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: pnlColor, opacity: 0.85 }}>
						{totals.pnlPct >= 0 ? "+" : ""}{totals.pnlPct.toFixed(2)}% return
					</Typography>
				)}
			</Box>
		</Box>
	);
}

// ─── Main chart area ──────────────────────────────────────────────────────────
function ChartArea({ filteredData, buyEvents, sellEvents, yDomain, gradientStop, theme }) {
	const teal = theme.palette.primary.main;
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const gridColor = theme.palette.divider;

	const tickCount = filteredData.length > 90 ? 6 : filteredData.length > 30 ? 5 : 4;

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart data={filteredData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
				<defs>
					<linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={green} stopOpacity={0.28} />
						<stop offset={`${Math.max(0, gradientStop - 2)}%`} stopColor={green} stopOpacity={0.06} />
						<stop offset={`${Math.min(100, gradientStop + 2)}%`} stopColor={red} stopOpacity={0.06} />
						<stop offset="100%" stopColor={red} stopOpacity={0.28} />
					</linearGradient>
				</defs>

				<CartesianGrid
					strokeDasharray="0"
					horizontal
					vertical={false}
					stroke={gridColor}
					strokeOpacity={0.5}
				/>

				<XAxis
					dataKey="date"
					tickFormatter={fmtAxisDate}
					tickCount={tickCount}
					tick={{ fontSize: 10, fill: theme.palette.text.secondary, fontFamily: "DM Sans" }}
					axisLine={false}
					tickLine={false}
					interval="preserveStartEnd"
				/>

				<YAxis
					domain={yDomain}
					tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(1) + "k" : v.toFixed(0)}`}
					tick={{ fontSize: 10, fill: theme.palette.text.secondary, fontFamily: "DM Sans" }}
					axisLine={false}
					tickLine={false}
					width={52}
				/>

				<Tooltip
					content={<ChartTooltip theme={theme} />}
					cursor={{ stroke: theme.palette.divider, strokeWidth: 1, strokeDasharray: "4 4" }}
				/>

				{/* Area fill under price curve */}
				<Area
					type="monotone"
					dataKey="price"
					fill="url(#priceGradient)"
					stroke={teal}
					strokeWidth={2}
					dot={false}
					activeDot={{ r: 4, fill: teal, stroke: theme.palette.background.paper, strokeWidth: 2 }}
				/>

				{/* Avg buy step function line */}
				<Line
					type="stepAfter"
					dataKey="avgBuy"
					stroke={theme.palette.text.secondary}
					strokeWidth={1.5}
					strokeDasharray="5 4"
					dot={false}
					connectNulls={false}
					activeDot={false}
				/>

				{/* Buy markers ▲ */}
				{buyEvents.map((ev, i) => (
					<ReferenceDot
						key={`b${i}`}
						x={ev.date}
						y={ev.price}
						r={5}
						fill={green}
						stroke={theme.palette.background.paper}
						strokeWidth={1.5}
						label={{ value: "▲", position: "top", fill: green, fontSize: 9, fontWeight: 700 }}
					/>
				))}

				{/* Sell markers ▼ */}
				{sellEvents.map((ev, i) => (
					<ReferenceDot
						key={`s${i}`}
						x={ev.date}
						y={ev.price}
						r={5}
						fill={red}
						stroke={theme.palette.background.paper}
						strokeWidth={1.5}
						label={{ value: "▼", position: "bottom", fill: red, fontSize: 9, fontWeight: 700 }}
					/>
				))}
			</ComposedChart>
		</ResponsiveContainer>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StockChartModal({
	open,
	onClose,
	stock,
	history,
	ltpMap,
	activeStockMetrics,
	onAddMore,
	onSell,
}) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const [range, setRange] = useState("1Y");

	const stockName = stock?.stockName ?? "";
	const isActive = (stock?.quantity ?? 0) > 0;
	const ltp = ltpMap?.[stockName]?.ltp ?? null;
	const metrics = activeStockMetrics?.[stock?._id];
	const avgPrice = metrics?.avgPrice ?? stock?.avgPrice ?? 100;

	// Generate mock price data (1 year of trading days)
	const allPriceData = useMemo(() => {
		if (!stockName) return [];
		return generateMockPriceData(stockName, avgPrice, ltp, 365);
	}, [stockName, avgPrice, ltp]);

	// Compute avg buy step line from real history
	const avgBuySteps = useMemo(() => computeAvgBuySteps(history ?? []), [history]);

	// Merge price + avgBuy
	const fullData = useMemo(
		() => mergePriceWithAvgBuy(allPriceData, avgBuySteps),
		[allPriceData, avgBuySteps],
	);

	// Filter by time range
	const filteredData = useMemo(() => {
		const r = RANGES.find((x) => x.label === range);
		if (!r || r.days >= 9999 || !fullData.length) return fullData;
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - r.days);
		const cutStr = cutoff.toISOString().split("T")[0];
		return fullData.filter((d) => d.date >= cutStr);
	}, [fullData, range]);

	// Y-domain + gradient stop
	const { yDomain, gradientStop } = useMemo(() => {
		if (!filteredData.length) return { yDomain: [0, 100], gradientStop: 50 };
		const allVals = filteredData.flatMap((d) =>
			[d.price, d.avgBuy].filter((v) => v != null),
		);
		const mn = Math.min(...allVals) * 0.97;
		const mx = Math.max(...allVals) * 1.03;
		const latestAvg = [...filteredData].reverse().find((d) => d.avgBuy != null)?.avgBuy ?? mn;
		const stop = ((mx - latestAvg) / (mx - mn)) * 100;
		return { yDomain: [mn, mx], gradientStop: Math.max(0, Math.min(100, stop)) };
	}, [filteredData]);

	// Buy/sell marker events (find nearest price point for each event date)
	const { buyEvents, sellEvents } = useMemo(() => {
		const priceMap = Object.fromEntries(filteredData.map((d) => [d.date, d.price]));
		const buys = [];
		const sells = [];
		for (const row of history ?? []) {
			const bd = row.date?.split("T")[0];
			if (bd && priceMap[bd]) buys.push({ date: bd, price: priceMap[bd] });
			if (row.dateSold && row.quantitySold > 0) {
				const sd = row.dateSold.split("T")[0];
				if (priceMap[sd]) sells.push({ date: sd, price: priceMap[sd] });
			}
		}
		return { buyEvents: buys, sellEvents: sells };
	}, [filteredData, history]);

	// ── Chart header (stock name + LTP + P&L) ────────────────────────────────
	const pnl = ltp != null && (metrics?.avgPrice ?? stock?.avgPrice)
		? (ltp - (metrics?.avgPrice ?? stock?.avgPrice)) * (stock?.quantity ?? 0)
		: null;
	const pnlPct = ltp != null && (metrics?.avgPrice ?? stock?.avgPrice) > 0
		? ((ltp - (metrics?.avgPrice ?? stock?.avgPrice)) / (metrics?.avgPrice ?? stock?.avgPrice)) * 100
		: null;
	const green = theme.palette.success.main;
	const red = theme.palette.error.main;
	const pnlColor = pnl === null ? "text.disabled" : pnl > 0 ? green : pnl < 0 ? red : "text.secondary";

	// ── Mobile layout ─────────────────────────────────────────────────────────
	if (isMobile) {
		return (
			<Modal open={open} onClose={onClose} sx={{ display: "flex", alignItems: "flex-end" }}>
				<Box
					sx={{
						width: "100%",
						maxHeight: "95vh",
						bgcolor: "background.paper",
						borderRadius: "16px 16px 0 0",
						display: "flex",
						flexDirection: "column",
						overflow: "hidden",
						outline: "none",
					}}
				>
					{/* Header */}
					<Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
						<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
							<Box>
								<Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
									<Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>{stockName}</Typography>
									<Typography sx={{ fontSize: "0.65rem", color: "text.secondary", letterSpacing: "0.05em" }}>NSE</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.25 }}>
									<Typography sx={{ fontSize: "1.3rem", fontWeight: 800, fontVariantNumeric: "tabular-nums", color: theme.palette.primary.main }}>
										{ltp != null ? rupee(ltp, 2) : "—"}
									</Typography>
									{pnl != null && (
										<Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: pnlColor }}>
											{pnl >= 0 ? "+" : "−"}{rupee(pnl)} ({pnlPct != null ? `${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%` : ""})
										</Typography>
									)}
								</Box>
							</Box>
							<IconButton size="small" onClick={onClose}>
								<CloseIcon fontSize="small" />
							</IconButton>
						</Box>
						<Box sx={{ mt: 1 }}>
							<RangePills selected={range} onChange={setRange} theme={theme} />
						</Box>
					</Box>

					{/* Scrollable content */}
					<Box sx={{ flex: 1, overflowY: "auto" }}>
						{/* Chart */}
						<Box sx={{ height: "45vh", px: 0.5, pt: 1, pb: 0 }}>
							<ChartArea
								filteredData={filteredData}
								buyEvents={buyEvents}
								sellEvents={sellEvents}
								yDomain={yDomain}
								gradientStop={gradientStop}
								theme={theme}
							/>
						</Box>

						<Divider sx={{ mx: 2 }} />

						{/* Panel */}
						{isActive ? (
							<HoldingsPanel
								stock={stock}
								metrics={metrics}
								ltp={ltp}
								onAddMore={onAddMore}
								onSell={onSell}
								theme={theme}
							/>
						) : (
							<TradeSummaryPanel stock={stock} metrics={metrics} history={history} theme={theme} />
						)}
					</Box>
				</Box>
			</Modal>
		);
	}

	// ── Desktop layout ────────────────────────────────────────────────────────
	return (
		<Modal open={open} onClose={onClose}>
			<Box
				sx={{
					position: "absolute",
					top: "50%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: "94vw",
					maxWidth: 1300,
					height: "88vh",
					bgcolor: "background.paper",
					border: `1px solid ${theme.palette.divider}`,
					boxShadow: 16,
					borderRadius: 2,
					display: "flex",
					overflow: "hidden",
					outline: "none",
				}}
			>
				{/* ── Left: chart area ─────────────────────────────────── */}
				<Box
					sx={{
						flex: "0 0 65%",
						display: "flex",
						flexDirection: "column",
						borderRight: `1px solid ${theme.palette.divider}`,
						overflow: "hidden",
					}}
				>
					{/* Chart header */}
					<Box
						sx={{
							px: 3,
							pt: 2.5,
							pb: 2,
							flexShrink: 0,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
							<Box>
								<Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.25 }}>
									<Typography
										sx={{
											fontSize: "1.15rem",
											fontWeight: 700,
											letterSpacing: "-0.01em",
										}}
									>
										{stockName}
									</Typography>
									<Typography sx={{ fontSize: "0.68rem", color: "text.secondary", letterSpacing: "0.06em" }}>
										NSE
									</Typography>
								</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
									<Typography
										sx={{
											fontSize: "1.6rem",
											fontWeight: 800,
											fontVariantNumeric: "tabular-nums",
											color: theme.palette.primary.main,
											letterSpacing: "-0.02em",
											lineHeight: 1,
										}}
									>
										{ltp != null ? rupee(ltp, 2) : "—"}
									</Typography>
									{pnl != null && (
										<Box
											sx={{
												px: 1,
												py: 0.3,
												borderRadius: "6px",
												bgcolor: `${pnlColor}18`,
												border: `1px solid ${pnlColor}40`,
											}}
										>
											<Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: pnlColor, fontVariantNumeric: "tabular-nums" }}>
												{pnl >= 0 ? "+" : "−"}{rupee(pnl)}
												{pnlPct != null ? ` (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%)` : ""}
											</Typography>
										</Box>
									)}
								</Box>
							</Box>

							<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
								<RangePills selected={range} onChange={setRange} theme={theme} />
								<IconButton size="small" onClick={onClose} sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}>
									<CloseIcon fontSize="small" />
								</IconButton>
							</Box>
						</Box>

						{/* Legend */}
						<Box sx={{ display: "flex", gap: 2.5, mt: 1.5 }}>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Box sx={{ width: 16, height: 2, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
								<Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Price</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Box sx={{ width: 16, height: 0, borderTop: `2px dashed ${theme.palette.text.secondary}`, borderRadius: 1 }} />
								<Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Avg Buy</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: green }} />
								<Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Buy</Typography>
							</Box>
							<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: red }} />
								<Typography sx={{ fontSize: "0.65rem", color: "text.secondary" }}>Sell</Typography>
							</Box>
						</Box>
					</Box>

					{/* Chart */}
					<Box sx={{ flex: 1, py: 1, pr: 1 }}>
						<ChartArea
							filteredData={filteredData}
							buyEvents={buyEvents}
							sellEvents={sellEvents}
							yDomain={yDomain}
							gradientStop={gradientStop}
							theme={theme}
						/>
					</Box>

					{/* Mock data notice */}
					<Box sx={{ px: 3, py: 1, flexShrink: 0, borderTop: `1px solid ${theme.palette.divider}` }}>
						<Typography sx={{ fontSize: "0.6rem", color: "text.disabled", letterSpacing: "0.04em" }}>
							⚠ Price data is simulated — live historical data coming in Phase 5 (Upstox API integration)
						</Typography>
					</Box>
				</Box>

				{/* ── Right: holdings / trade summary panel ────────────── */}
				<Box
					sx={{
						flex: "0 0 35%",
						display: "flex",
						flexDirection: "column",
						overflow: "auto",
						bgcolor: "background.elevated",
					}}
				>
					{isActive ? (
						<HoldingsPanel
							stock={stock}
							metrics={metrics}
							ltp={ltp}
							onAddMore={onAddMore}
							onSell={onSell}
							theme={theme}
						/>
					) : (
						<TradeSummaryPanel stock={stock} metrics={metrics} history={history} theme={theme} />
					)}
				</Box>
			</Box>
		</Modal>
	);
}
