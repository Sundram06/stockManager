/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { memo, useCallback, useState, Fragment } from "react";
import { Plus, Minus, BarChart2, Trash2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

const rupee = (num, decimals = 2) =>
  typeof num === "number" && !isNaN(num)
    ? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: decimals })}`
    : "—";

const pct = (num) =>
  typeof num === "number" && !isNaN(num)
    ? `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`
    : null;

const pnlColorClass = (val) =>
  val === null || val === undefined
    ? "text-muted-foreground"
    : val > 0 ? "text-[var(--success)]" : val < 0 ? "text-destructive" : "text-muted-foreground";

// ─── Active stock row ─────────────────────────────────────────────────────────

function ActiveStockRow({ stock, activeStockMetrics, ltpMap, onTap }) {
  const metrics = activeStockMetrics[stock._id];
  const totalInvested = metrics?.totalInvested ?? 0;
  const avgPrice = metrics?.avgPrice ?? stock.avgPrice;
  const live = ltpMap[stock.stockName];
  const ltp = live?.ltp ?? null;
  const cp = live?.cp ?? null;

  const pnl = ltp !== null ? (ltp - avgPrice) * stock.quantity : null;
  const pnlPct = ltp !== null && avgPrice > 0 ? ((ltp - avgPrice) / avgPrice) * 100 : null;
  const dayChangePct = ltp !== null && cp != null && cp > 0 ? ((ltp - cp) / cp) * 100 : null;

  const pnlCls = pnlColorClass(pnl);

  return (
    <div
      onClick={onTap}
      className="px-4 py-3 cursor-pointer select-none active:bg-muted/50 transition-colors"
    >
      <div className="flex justify-between mb-0.5">
        <span className="text-[0.72rem] text-muted-foreground">
          Qty. {stock.quantity}&nbsp;&nbsp;•&nbsp;&nbsp;Avg. {rupee(avgPrice)}
        </span>
        <span className={`text-[0.72rem] font-medium ${pnlCls}`}>{pct(pnlPct) ?? "—"}</span>
      </div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[0.98rem] font-semibold tracking-tight">{stock.stockName}</span>
        <span className={`text-[0.95rem] font-semibold ${pnlCls}`}>{pnl !== null ? rupee(pnl) : "—"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[0.72rem] text-muted-foreground">Invested {rupee(totalInvested, 0)}</span>
        <span className="text-[0.72rem] text-muted-foreground">
          LTP {ltp !== null ? rupee(ltp) : "—"}
          {dayChangePct !== null && (
            <span className={dayChangePct >= 0 ? "text-[var(--success)] ml-1" : "text-destructive ml-1"}>
              ({pct(dayChangePct)})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// ─── Dormant stock row ────────────────────────────────────────────────────────

function DormantStockRow({ stock, historyByStockId, onTap }) {
  const d = computeDormantMetrics(historyByStockId[stock._id] || []);
  const pnlCls = pnlColorClass(d.totalPnl);
  const pnlPct =
    d.avgBuyPrice > 0 ? ((d.avgSellPrice - d.avgBuyPrice) / d.avgBuyPrice) * 100 : null;

  return (
    <div
      onClick={onTap}
      className="px-4 py-3 cursor-pointer select-none active:bg-muted/50 transition-colors"
    >
      <div className="flex justify-between mb-0.5">
        <span className="text-[0.72rem] text-muted-foreground">
          Qty. {d.totalSoldQty}&nbsp;&nbsp;•&nbsp;&nbsp;Avg. {rupee(d.avgBuyPrice)}
        </span>
        <span className={`text-[0.72rem] font-medium ${pnlCls}`}>{pct(pnlPct) ?? "—"}</span>
      </div>
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[0.98rem] font-semibold tracking-tight">{stock.stockName}</span>
        <span className={`text-[0.95rem] font-semibold ${pnlCls}`}>{rupee(d.totalPnl)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[0.72rem] text-muted-foreground">Invested {rupee(d.totalSoldCost, 0)}</span>
        <span className="text-[0.72rem] text-muted-foreground">Sold at {rupee(d.avgSellPrice)}</span>
      </div>
    </div>
  );
}

// ─── Action sheet ─────────────────────────────────────────────────────────────

function ActionSheet({ stock, activeTab, ltpMap, onClose, onAdd, onSell, onViewHistory, onDelete }) {
  const isActive = activeTab === 0;
  const live = stock ? ltpMap[stock?.stockName] : null;
  const ltp = live?.ltp ?? null;
  const cp = live?.cp ?? null;
  const dayChange = ltp !== null && cp !== null ? ltp - cp : null;
  const dayChangePct = dayChange !== null && cp > 0 ? (dayChange / cp) * 100 : null;
  const dayColorCls = dayChange === null ? "text-muted-foreground" : dayChange >= 0 ? "text-[var(--success)]" : "text-destructive";

  const handleAdd = useCallback(() => { onClose(); onAdd(stock); }, [onClose, onAdd, stock]);
  const handleSell = useCallback(() => { onClose(); onSell(stock._id); }, [onClose, onSell, stock]);
  const handleHistory = useCallback(() => { onClose(); onViewHistory(stock); }, [onClose, onViewHistory, stock]);
  const handleDelete = useCallback(() => { onClose(); onDelete(stock); }, [onClose, onDelete, stock]);

  return (
    <Sheet open={!!stock} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        hideClose
        className="p-0 rounded-t-2xl border-t border-border max-w-[600px] mx-auto left-0 right-0"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>

        {/* Stock info */}
        <div className="px-4 pt-1 pb-3">
          <p className="text-lg font-bold tracking-tight">{stock?.stockName}</p>
          {isActive && ltp !== null && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm text-muted-foreground">NSE</span>
              <span className={`text-sm font-semibold ${dayColorCls}`}>{rupee(ltp)}</span>
              {dayChange !== null && (
                <span className={`text-sm ${dayColorCls}`}>
                  {dayChange >= 0 ? "+" : ""}{rupee(dayChange)} ({pct(dayChangePct)})
                </span>
              )}
            </div>
          )}
          {isActive && ltp === null && (
            <p className="text-sm text-muted-foreground mt-0.5">NSE · price unavailable</p>
          )}
        </div>

        <Separator />

        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Primary actions */}
          <div className="flex gap-3">
            <Button className="flex-1 h-11 font-bold gap-2" onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Add
            </Button>
            {isActive && (
              <Button
                className="flex-1 h-11 font-bold gap-2 bg-[var(--chart-3)] hover:bg-[var(--chart-3)]/90 text-white"
                onClick={handleSell}
              >
                <Minus className="h-4 w-4" /> Sell
              </Button>
            )}
          </div>
          {/* Secondary actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-11 gap-2" onClick={handleHistory}>
              <BarChart2 className="h-4 w-4" /> History
            </Button>
            <Button variant="outline" className="flex-1 h-11 gap-2 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
        {/* Safe area bottom padding */}
        <div className="pb-safe pb-3" />
      </SheetContent>
    </Sheet>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

function PortfolioMobileList({ stocks, activeTab, historyByStockId, activeStockMetrics, ltpMap, onAdd, onSell, onViewHistory, onDelete }) {
  const [selectedStock, setSelectedStock] = useState(null);

  if (stocks.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm mb-6 p-6 text-center">
        <p className="text-base font-medium text-muted-foreground">
          {activeTab === 0 ? "No active stocks in your portfolio" : "No dormant stocks"}
        </p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {activeTab === 0
            ? "Start by adding a stock to track your investments"
            : "Stocks become dormant when you sell all shares"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-6">
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
            {i < stocks.length - 1 && <Separator />}
          </Fragment>
        ))}
      </div>

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

export default memo(PortfolioMobileList);
