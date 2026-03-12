import { TableRow, TableCell } from "@mui/material";
import { memo, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import StockActions from "./StockActions";
import { computeDormantMetrics } from "../util/portfolioMetrics.mjs";

function StockTableRow({
stock,
activeTab,
historyByStockId,
activeStockMetrics,
onAdd,
onSell,
onViewHistory,
onDelete,
}) {
const handleAdd = useCallback(() => onAdd(stock), [onAdd, stock]);
const handleViewHistory = useCallback(
() => onViewHistory(stock),
[onViewHistory, stock],
);
const handleDelete = useCallback(() => onDelete(stock), [onDelete, stock]);
const handleSell = useCallback(() => onSell(stock._id), [onSell, stock._id]);

const rupee = (num) =>
typeof num === "number" && !isNaN(num)
		? `₹${num.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
: "—";

const dormantMetrics = useMemo(
() =>
activeTab === 1
? computeDormantMetrics(historyByStockId[stock._id] || [])
: null,
[activeTab, historyByStockId, stock._id],
);

const activeMetrics = useMemo(() => {
if (activeTab === 1) return null;
const metrics = activeStockMetrics[stock._id];
const totalInvested = metrics ? metrics.totalInvested : 0;
const avgPrice = metrics ? metrics.avgPrice : stock.avgPrice;
const currVal =
stock.quantity > 0 && stock.ltp
? (stock.quantity * stock.ltp).toFixed(2)
: 0;
const pnl =
stock.pnl !== undefined
? stock.pnl
: (stock.ltp - avgPrice) * stock.quantity;
return { totalInvested, currVal, pnl, avgPrice };
}, [activeTab, stock, activeStockMetrics]);

if (activeTab === 1 && dormantMetrics) {
const {
totalSoldQty,
totalSoldCost,
totalSellValue,
totalPnl,
avgBuyPrice,
avgSellPrice,
} = dormantMetrics;

return (
<TableRow hover>
<TableCell>{stock.stockName}</TableCell>
<TableCell align="right">{totalSoldQty}</TableCell>
<TableCell align="right">{rupee(avgBuyPrice)}</TableCell>
<TableCell align="right">{rupee(totalSoldCost)}</TableCell>
<TableCell align="right">{rupee(avgSellPrice)}</TableCell>
<TableCell align="right">{rupee(totalSellValue)}</TableCell>
<TableCell
align="right"
style={{
fontWeight: 700,
color:
totalPnl > 0 ? "#1a882c" : totalPnl < 0 ? "#c91b24" : "#1d1d1d",
}}
>
{rupee(totalPnl)}
</TableCell>
<TableCell align="center">
<StockActions
onAdd={handleAdd}
onSell={null}
onViewHistory={handleViewHistory}
onDelete={handleDelete}
canSell={false}
/>
</TableCell>
</TableRow>
);
}

const { totalInvested, currVal, pnl, avgPrice } = activeMetrics;

return (
<TableRow hover>
<TableCell>{stock.stockName}</TableCell>
<TableCell align="right">{stock.quantity}</TableCell>
<TableCell align="right">{rupee(avgPrice)}</TableCell>
<TableCell align="right">{rupee(totalInvested)}</TableCell>
<TableCell align="right">{rupee(stock.ltp)}</TableCell>
<TableCell align="right">{rupee(currVal)}</TableCell>
<TableCell
align="right"
style={{
fontWeight: 700,
color: pnl > 0 ? "#1a882c" : pnl < 0 ? "#c91b24" : "#1d1d1d",
}}
>
{rupee(pnl)}
</TableCell>
<TableCell align="center">
<StockActions
onAdd={handleAdd}
onSell={handleSell}
onViewHistory={handleViewHistory}
onDelete={handleDelete}
canSell={stock.quantity > 0}
/>
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
ltp: PropTypes.number,
pnl: PropTypes.number,
}).isRequired,
activeTab: PropTypes.number.isRequired,
historyByStockId: PropTypes.object.isRequired,
activeStockMetrics: PropTypes.object.isRequired,
onAdd: PropTypes.func.isRequired,
onSell: PropTypes.func.isRequired,
onViewHistory: PropTypes.func.isRequired,
onDelete: PropTypes.func.isRequired,
};

const MemoizedStockTableRow = memo(StockTableRow);
export default MemoizedStockTableRow;