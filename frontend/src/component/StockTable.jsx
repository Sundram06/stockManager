/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { memo, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import StockTableRow from "./StockTableRow";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

const ACTIVE_COLS = [
  { id: "name",     label: "Stock",         align: "left"  },
  { id: "qty",      label: "Quantity",       align: "right" },
  { id: "avgPrice", label: "Avg. Buy Price", align: "right" },
  { id: "invested", label: "Total Invested", align: "right" },
  { id: "ltp",      label: "LTP",            align: "right" },
  { id: "currVal",  label: "Current Value",  align: "right" },
  { id: "pnl",      label: "P&L",            align: "right" },
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

const nullLast = (val, dir) =>
  val === null || val === undefined
    ? dir === "asc" ? Infinity : -Infinity
    : val;

function SortIcon({ colId, activeCol, dir }) {
  if (colId !== activeCol) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
  return dir === "asc"
    ? <ArrowUp className="ml-1 h-3 w-3 inline" />
    : <ArrowDown className="ml-1 h-3 w-3 inline" />;
}

function StockTable({ stocks, activeTab, historyByStockId, activeStockMetrics, ltpMap, onAdd, onSell, onViewHistory, onDelete }) {
  const [sortByTab, setSortByTab] = useState({
    0: { col: "name", dir: "asc" },
    1: { col: "name", dir: "asc" },
  });

  const { col, dir } = sortByTab[activeTab] ?? { col: "name", dir: "asc" };

  const handleSort = (newCol) => {
    setSortByTab((prev) => {
      const current = prev[activeTab];
      const newDir = current.col === newCol && current.dir === "asc" ? "desc" : "asc";
      return { ...prev, [activeTab]: { col: newCol, dir: newDir } };
    });
  };

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
      if (typeof aVal === "string") return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return dir === "asc" ? aVal - bVal : bVal - aVal;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocks, col, dir, activeTab, activeStockMetrics, ltpMap, dormantMetricsMap]);

  const cols = activeTab === 0 ? ACTIVE_COLS : DORMANT_COLS;

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm mb-6 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {cols.map((c) => (
              <TableHead
                key={c.id}
                className={cn(
                  "whitespace-nowrap font-bold cursor-pointer select-none py-3",
                  c.align === "right" ? "text-right" : "text-left"
                )}
                onClick={() => handleSort(c.id)}
              >
                {c.label}
                <SortIcon colId={c.id} activeCol={col} dir={dir} />
              </TableHead>
            ))}
            <TableHead className="text-center font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStocks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols.length + 1} className="text-center py-10">
                <p className="text-base font-medium text-muted-foreground">
                  {activeTab === 0 ? "No active stocks in your portfolio" : "No dormant stocks"}
                </p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {activeTab === 0
                    ? "Start by adding a stock to track your investments"
                    : "Stocks become dormant when you sell all shares"}
                </p>
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
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
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
  onDelete: PropTypes.func.isRequired,
};

export default memo(StockTable);
