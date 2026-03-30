/* eslint-disable react/prop-types */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { fetchStocks } from "../util/api/stocks.mjs";
import { fetchStockHistoryById } from "../util/api/history.mjs";
import {
  groupHistoryByStockId,
  computeActiveStockMetrics,
} from "../util/portfolioMetrics.mjs";

const STALE = 60_000;
const GC = 5 * 60_000;

// CSS variable colour tokens (match index.css)
const COLOR = {
  success: "var(--success)",
  destructive: "var(--destructive)",
  primary: "var(--primary)",
  muted: "var(--muted-foreground)",
};

const fmt = (num) =>
  typeof num === "number" && !isNaN(num)
    ? `₹${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : "—";

const fmtPct = (num) =>
  typeof num === "number" && !isNaN(num)
    ? `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`
    : null;

function pnlAccent(val) {
  if (val === null || val === undefined) return COLOR.muted;
  return val > 0 ? COLOR.success : val < 0 ? COLOR.destructive : COLOR.muted;
}

// ─── Value card ────────────────────────────────────────────────────────────────
function ValueCard({ label, value, prefix, accent, isPnl }) {
  return (
    <div
      className="bg-card rounded-r-lg px-2 sm:px-4 py-2 sm:py-3 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow"
      style={{
        borderLeft: `3px solid ${accent}`,
        background: isPnl ? `linear-gradient(135deg, ${accent}12 0%, transparent 55%)` : undefined,
      }}
    >
      <span
        className="text-[0.58rem] font-bold uppercase tracking-widest leading-none"
        style={{ color: COLOR.muted }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-0.5">
        {prefix && (
          <span
            className="text-[0.8rem] font-bold leading-none"
            style={{ color: isPnl ? accent : "var(--foreground)" }}
          >
            {prefix}
          </span>
        )}
        <span
          className="text-[0.82rem] sm:text-[1.05rem] font-bold leading-snug tabular-nums"
          style={{ color: isPnl ? accent : "var(--foreground)" }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

// ─── Stock card ────────────────────────────────────────────────────────────────
function StockCard({ label, stock, accent, isBest }) {
  const Icon = isBest ? TrendingUp : TrendingDown;

  return (
    <div
      className="bg-card rounded-r-lg px-2 sm:px-4 py-2 sm:py-3 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow"
      style={{
        borderLeft: `3px solid ${accent}`,
        background: `linear-gradient(135deg, ${accent}12 0%, transparent 55%)`,
      }}
    >
      <span
        className="text-[0.58rem] font-bold uppercase tracking-widest leading-none"
        style={{ color: COLOR.muted }}
      >
        {label}
      </span>
      {stock ? (
        <>
          <div className="flex items-center gap-1">
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: accent }} />
            <span
              className="text-[0.76rem] sm:text-[0.95rem] font-bold leading-snug tracking-tight truncate"
              style={{ color: "var(--foreground)" }}
            >
              {stock.name}
            </span>
          </div>
          <span
            className="text-[0.7rem] font-semibold leading-none"
            style={{ color: accent }}
          >
            {fmtPct(stock.pct)}
            {stock.pnl != null ? ` · ${fmt(stock.pnl)}` : ""}
          </span>
        </>
      ) : (
        <span className="text-base font-bold text-muted-foreground">—</span>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function PortfolioSummary({ ltpMap }) {
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

  const historyByStockId = useMemo(() => groupHistoryByStockId(historyRows), [historyRows]);
  const activeStockMetrics = useMemo(
    () => computeActiveStockMetrics(stocks, historyByStockId),
    [stocks, historyByStockId]
  );

  const summary = useMemo(() => {
    const activeStocks = stocks.filter((s) => s.quantity > 0);
    let totalInvested = 0, currentValue = 0, dayChange = 0, hasLiveData = false;
    let bestStock = null, worstStock = null, bestPct = -Infinity, worstPct = Infinity;

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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-5">
      <ValueCard label="Total Invested" value={fmt(summary.totalInvested)} accent={COLOR.primary} />
      <ValueCard
        label="Current Value"
        value={summary.currentValue !== null ? fmt(summary.currentValue) : "—"}
        accent={COLOR.primary}
      />
      <ValueCard
        label="Unrealized P&L"
        value={summary.unrealizedPnL !== null ? fmt(summary.unrealizedPnL) : "—"}
        prefix={summary.unrealizedPnL !== null ? (summary.unrealizedPnL >= 0 ? "+" : "−") : ""}
        accent={pnlAccent(summary.unrealizedPnL)}
        isPnl
      />
      <ValueCard
        label="Day Change"
        value={summary.dayChange !== null ? fmt(summary.dayChange) : "—"}
        prefix={summary.dayChange !== null ? (summary.dayChange >= 0 ? "+" : "−") : ""}
        accent={pnlAccent(summary.dayChange)}
        isPnl
      />
      <StockCard label="Best Performer" stock={summary.bestStock} accent={COLOR.success} isBest />
      <StockCard label="Worst Performer" stock={summary.worstStock} accent={COLOR.destructive} isBest={false} />
    </div>
  );
}
