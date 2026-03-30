/* eslint-disable react-refresh/only-export-components */
import { memo, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { TableCell, TableRow } from "@/components/ui/table";
import StockActions from "./StockActions";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

const rupee = (num) =>
  typeof num === "number" && !isNaN(num)
    ? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
    : "—";

const pnlStyle = (val) => {
  if (val === null || val === undefined) return {};
  return { color: val > 0 ? "var(--success)" : val < 0 ? "var(--destructive)" : undefined };
};

function StockTableRow({
  stock,
  activeTab,
  historyByStockId,
  activeStockMetrics,
  liveData,
  onAdd,
  onSell,
  onViewHistory,
  onDelete,
}) {
  const handleAdd = useCallback(() => onAdd(stock), [onAdd, stock]);
  const handleViewHistory = useCallback(() => onViewHistory(stock), [onViewHistory, stock]);
  const handleDelete = useCallback(() => onDelete(stock), [onDelete, stock]);
  const handleSell = useCallback(() => onSell(stock._id), [onSell, stock._id]);

  const dormantMetrics = useMemo(
    () => activeTab === 1 ? computeDormantMetrics(historyByStockId[stock._id] || []) : null,
    [activeTab, historyByStockId, stock._id]
  );

  const activeMetrics = useMemo(() => {
    if (activeTab === 1) return null;
    const metrics = activeStockMetrics[stock._id];
    const totalInvested = metrics ? metrics.totalInvested : 0;
    const avgPrice = metrics ? metrics.avgPrice : stock.avgPrice;
    const ltp = liveData?.ltp ?? null;
    const currVal = ltp !== null && stock.quantity > 0
      ? parseFloat((stock.quantity * ltp).toFixed(2)) : null;
    const pnl = ltp !== null
      ? parseFloat(((ltp - avgPrice) * stock.quantity).toFixed(2)) : null;
    return { totalInvested, currVal, pnl, avgPrice, ltp };
  }, [activeTab, stock, activeStockMetrics, liveData]);

  if (activeTab === 1 && dormantMetrics) {
    const { totalSoldQty, totalSoldCost, totalSellValue, totalPnl, avgBuyPrice, avgSellPrice } = dormantMetrics;
    return (
      <TableRow className="hover:bg-muted/40">
        <TableCell className="font-medium">{stock.stockName}</TableCell>
        <TableCell className="text-right">{totalSoldQty}</TableCell>
        <TableCell className="text-right">{rupee(avgBuyPrice)}</TableCell>
        <TableCell className="text-right">{rupee(totalSoldCost)}</TableCell>
        <TableCell className="text-right">{rupee(avgSellPrice)}</TableCell>
        <TableCell className="text-right">{rupee(totalSellValue)}</TableCell>
        <TableCell className="text-right font-bold" style={pnlStyle(totalPnl)}>
          {rupee(totalPnl)}
        </TableCell>
        <TableCell className="text-center">
          <StockActions onAdd={handleAdd} onSell={null} onViewHistory={handleViewHistory} onDelete={handleDelete} canSell={false} />
        </TableCell>
      </TableRow>
    );
  }

  const { totalInvested, currVal, pnl, avgPrice, ltp } = activeMetrics;

  return (
    <TableRow className="hover:bg-muted/40">
      <TableCell className="font-medium">{stock.stockName}</TableCell>
      <TableCell className="text-right">{stock.quantity}</TableCell>
      <TableCell className="text-right">{rupee(avgPrice)}</TableCell>
      <TableCell className="text-right">{rupee(totalInvested)}</TableCell>
      <TableCell className="text-right">{ltp !== null ? rupee(ltp) : "—"}</TableCell>
      <TableCell className="text-right">{currVal !== null ? rupee(currVal) : "—"}</TableCell>
      <TableCell className="text-right font-bold" style={pnlStyle(pnl)}>
        {rupee(pnl)}
      </TableCell>
      <TableCell className="text-center">
        <StockActions onAdd={handleAdd} onSell={handleSell} onViewHistory={handleViewHistory} onDelete={handleDelete} canSell={stock.quantity > 0} />
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

export default memo(StockTableRow);
