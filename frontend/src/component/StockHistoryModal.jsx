/* eslint-disable react/prop-types */
import PropTypes from "prop-types";
import { useMemo } from "react";
import { X, ArrowDown, ArrowUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { dateFormatter } from "../util/util.mjs";

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const rupeeAbs = (n, dec = 0) =>
  typeof n === "number" && !isNaN(n)
    ? `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: dec })}`
    : "—";

function computeHistoryTotals(historyRows) {
  let totalSoldQty = 0, totalSoldAmt = 0, totalSoldPL = 0, totalSoldCost = 0, totalSoldBuyQty = 0;
  let totalUnsoldQty = 0, totalUnsoldAmt = 0, totalSellPriceQty = 0, totalBuyPriceQty = 0;

  historyRows.forEach((row) => {
    const soldQty = row.quantitySold || 0;
    const buyQty = row.quantity || 0;
    const avgBuy = row.avgPrice || 0;
    const sellPrice = row.sellingPrice || 0;
    const pnl = row.pnl || 0;

    if (soldQty > 0) {
      totalSoldQty += soldQty;
      totalSoldAmt += soldQty * sellPrice;
      totalSoldPL += pnl;
      totalSellPriceQty += soldQty * sellPrice;
      totalSoldBuyQty += soldQty;
      totalSoldCost += soldQty * avgBuy;
      totalBuyPriceQty += soldQty * avgBuy;
    }
    const unsoldQty = buyQty - soldQty;
    if (unsoldQty > 0) {
      totalUnsoldQty += unsoldQty;
      totalUnsoldAmt += unsoldQty * avgBuy;
    }
  });

  return {
    totalSoldQty, totalSoldAmt, totalSoldPL, totalSoldCost,
    avgSoldPrice: totalSoldQty > 0 ? totalSellPriceQty / totalSoldQty : null,
    avgBuyPriceForSold: totalSoldBuyQty > 0 ? totalBuyPriceQty / totalSoldBuyQty : null,
    totalUnsoldQty, totalUnsoldAmt,
    avgBuyPrice: totalUnsoldQty > 0 ? totalUnsoldAmt / totalUnsoldQty : null,
  };
}

// ─── Mobile lot card ──────────────────────────────────────────────────────────

function LotCard({ lot, index }) {
  const soldQty = lot.quantitySold || 0;
  const buyQty = lot.quantity || 0;
  const unsoldQty = buyQty - soldQty;
  const isSold = soldQty >= buyQty;
  const isPartial = soldQty > 0 && soldQty < buyQty;

  const statusLabel = isSold ? "SOLD" : isPartial ? "PARTIAL" : "ACTIVE";
  const statusClasses = {
    SOLD: "bg-muted/60 text-muted-foreground",
    PARTIAL: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    ACTIVE: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  }[statusLabel];

  const pnlCls = lot.pnl > 0 ? "text-[var(--success)]" : lot.pnl < 0 ? "text-destructive" : "text-muted-foreground";
  const pnlSign = lot.pnl >= 0 ? "+" : "−";

  return (
    <div className="px-4 py-2.5">
      {/* Lot header */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-[0.62rem] font-bold text-muted-foreground/60 uppercase tracking-wider">
          Lot {index + 1}
        </span>
        <span className={`text-[0.58rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusClasses}`}>
          {statusLabel}
        </span>
      </div>

      {/* Buy row */}
      <div className="flex items-center gap-1.5">
        <ArrowDown className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
        <span className="text-[0.7rem] text-muted-foreground flex-1 leading-relaxed">
          {fmtDate(lot.date)}&ensp;{buyQty} qty @ ₹{parseFloat(lot.avgPrice || 0).toFixed(2)}
        </span>
        <span className="text-[0.7rem] text-muted-foreground tabular-nums shrink-0">
          Cost {rupeeAbs(buyQty * (lot.avgPrice || 0))}
        </span>
      </div>

      {/* Sell row */}
      {soldQty > 0 && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <ArrowUp className={`h-2.5 w-2.5 shrink-0 ${pnlCls}`} />
          <span className="text-[0.7rem] text-muted-foreground flex-1 leading-relaxed">
            {fmtDate(lot.dateSold)}&ensp;{soldQty} qty @ ₹{parseFloat(lot.sellingPrice || 0).toFixed(2)}
          </span>
          <span className={`text-[0.7rem] font-semibold tabular-nums shrink-0 ${pnlCls}`}>
            {pnlSign}{rupeeAbs(lot.pnl)}
          </span>
        </div>
      )}

      {/* Still held */}
      {isPartial && (
        <p className="text-[0.63rem] text-muted-foreground/60 mt-0.5 pl-4">
          {unsoldQty} shares still held
        </p>
      )}
    </div>
  );
}

// ─── Mobile summary footer ────────────────────────────────────────────────────

function MobileSummary({ totals }) {
  const pnlCls = totals.totalSoldPL > 0 ? "text-[var(--success)]" : totals.totalSoldPL < 0 ? "text-destructive" : "text-muted-foreground";
  const pnlSign = totals.totalSoldPL >= 0 ? "+" : "−";

  const soldBg = totals.totalSoldPL > 0
    ? "bg-green-500/8 dark:bg-green-500/12"
    : totals.totalSoldPL < 0
      ? "bg-red-500/8 dark:bg-red-500/12"
      : "bg-muted/40";

  return (
    <div className="shrink-0">
      <Separator />
      {totals.totalSoldQty > 0 && (
        <div className={`px-4 py-2.5 ${soldBg}`}>
          <p className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Total Sold</p>
          <div className="flex justify-between items-baseline">
            <span className="text-[0.7rem] text-muted-foreground flex-1 mr-2">
              {totals.totalSoldQty} qty&ensp;·&ensp;Avg Buy ₹{totals.avgBuyPriceForSold?.toFixed(2) ?? "—"}&ensp;·&ensp;Cost {rupeeAbs(totals.totalSoldCost)}
            </span>
            <span className={`text-[0.72rem] font-bold tabular-nums shrink-0 ${pnlCls}`}>
              {pnlSign}{rupeeAbs(totals.totalSoldPL)}
            </span>
          </div>
          <p className="text-[0.66rem] text-muted-foreground mt-0.5">
            Avg Sell ₹{totals.avgSoldPrice?.toFixed(2) ?? "—"}&ensp;·&ensp;Sell Value {rupeeAbs(totals.totalSoldAmt)}
          </p>
        </div>
      )}
      <Separator />
      {totals.totalUnsoldQty > 0 && (
        <div className="px-4 py-2.5 pb-5 bg-blue-500/6 dark:bg-blue-500/10">
          <p className="text-[0.58rem] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Total Unsold</p>
          <div className="flex justify-between items-baseline">
            <span className="text-[0.7rem] text-muted-foreground">
              {totals.totalUnsoldQty} qty&ensp;·&ensp;Avg Buy ₹{totals.avgBuyPrice?.toFixed(2) ?? "—"}
            </span>
            <span className="text-[0.72rem] font-semibold tabular-nums text-foreground">
              {rupeeAbs(totals.totalUnsoldAmt)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StockHistoryModal({ open, onClose, stockName, history }) {
  const isMobile = useMediaQuery("(max-width: 599px)");

  const sortedHistory = useMemo(
    () => history.slice().sort((a, b) => new Date(b.date) - new Date(a.date)),
    [history]
  );

  const totals = useMemo(() => computeHistoryTotals(sortedHistory), [sortedHistory]);

  const soldSummaryClass = totals.totalSoldPL > 0
    ? "bg-green-500/10 dark:bg-green-500/16"
    : totals.totalSoldPL < 0
      ? "bg-red-500/10 dark:bg-red-500/16"
      : "bg-muted/50";

  // ── Mobile ────────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="bottom"
          hideClose
          className="p-0 rounded-t-2xl border-t border-border flex flex-col max-h-[90vh]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-4 pb-1 shrink-0">
            <div className="w-9 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-1 pb-2 shrink-0">
            <span className="text-[0.95rem] font-bold">{stockName} History</span>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="shrink-0" />

          {/* Lot cards — scrollable */}
          <div className="flex-1 overflow-y-auto">
            {sortedHistory.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">No history yet</p>
              </div>
            ) : (
              [...sortedHistory].reverse().map((lot, i) => (
                <div key={lot._id}>
                  <LotCard lot={lot} index={i} />
                  {i < sortedHistory.length - 1 && <Separator />}
                </div>
              ))
            )}
          </div>

          <MobileSummary totals={totals} />
        </SheetContent>
      </Sheet>
    );
  }

  // ── Desktop ───────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[96vw] max-w-[1200px] max-h-[88vh] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <DialogTitle className="text-base font-bold">{stockName} History</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm">
              <TableRow>
                {["Date Purchased","Quantity","Price","Total Cost","Date Sold","Qty Sold","Sell Price","Total Sell","P&L"].map((h) => (
                  <TableHead key={h} className="whitespace-nowrap font-bold text-xs py-2.5">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.map((row, index) => {
                const costPrice = row.avgPrice !== undefined
                  ? (row.quantity * row.avgPrice).toFixed(2) : "—";
                const totalSellPrice = row.quantitySold && row.sellingPrice !== undefined
                  ? (row.quantitySold * row.sellingPrice).toFixed(2) : "—";
                const pnlCls = row.pnl > 0 ? "text-[var(--success)]" : row.pnl < 0 ? "text-destructive" : "";
                return (
                  <TableRow key={row._id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <TableCell className="text-xs whitespace-nowrap py-2">{dateFormatter(row.date)}</TableCell>
                    <TableCell className="text-xs text-right py-2 tabular-nums">{row.quantity}</TableCell>
                    <TableCell className="text-xs text-right py-2 tabular-nums">
                      {row.avgPrice !== undefined ? parseFloat(row.avgPrice).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right py-2 tabular-nums">{costPrice}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap py-2">
                      {row.dateSold ? dateFormatter(row.dateSold) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right py-2 tabular-nums">{row.quantitySold || "—"}</TableCell>
                    <TableCell className="text-xs text-right py-2 tabular-nums">
                      {row.sellingPrice !== undefined ? parseFloat(row.sellingPrice).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-right py-2 tabular-nums">{totalSellPrice}</TableCell>
                    <TableCell className={`text-xs text-right py-2 tabular-nums font-bold ${pnlCls}`}>
                      {row.pnl !== undefined ? parseFloat(row.pnl).toFixed(2) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Total Sold */}
              <TableRow className={soldSummaryClass}>
                <TableCell className="text-xs font-bold py-2">Total Sold</TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">{totals.totalSoldQty || "—"}</TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">
                  {totals.avgBuyPriceForSold ? parseFloat(totals.avgBuyPriceForSold).toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">
                  {totals.totalSoldCost > 0 ? totals.totalSoldCost.toFixed(2) : "—"}
                </TableCell>
                <TableCell className="py-2" />
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">{totals.totalSoldQty || "—"}</TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">
                  {totals.avgSoldPrice ? parseFloat(totals.avgSoldPrice).toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">
                  {totals.totalSoldAmt > 0 ? totals.totalSoldAmt.toFixed(2) : "—"}
                </TableCell>
                <TableCell className={`text-xs text-right font-bold tabular-nums py-2 ${totals.totalSoldPL > 0 ? "text-[var(--success)]" : totals.totalSoldPL < 0 ? "text-destructive" : ""}`}>
                  {totals.totalSoldPL !== 0 ? parseFloat(totals.totalSoldPL).toFixed(2) : "—"}
                </TableCell>
              </TableRow>

              {/* Total Unsold */}
              <TableRow className="bg-blue-500/6 dark:bg-blue-500/10">
                <TableCell className="text-xs font-bold py-2">Total Unsold</TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">{totals.totalUnsoldQty || "—"}</TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">
                  {totals.avgBuyPrice ? parseFloat(totals.avgBuyPrice).toFixed(2) : "—"}
                </TableCell>
                <TableCell className="text-xs text-right font-bold tabular-nums py-2">
                  {totals.totalUnsoldAmt > 0 ? totals.totalUnsoldAmt.toFixed(2) : "—"}
                </TableCell>
                <TableCell colSpan={5} className="py-2" />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

StockHistoryModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  stockName: PropTypes.string.isRequired,
  history: PropTypes.array.isRequired,
};
