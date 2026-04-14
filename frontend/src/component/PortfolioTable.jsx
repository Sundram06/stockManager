import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Typography } from "@mui/material";
import PortfolioViewSwitch from "./PortfolioViewSwitch";
import AddStock from "./AddStock";
import StockHistoryModal from "./StockHistoryModal";
import DeleteStockModal from "./DeleteStockModal";

// Lazy-loaded: Recharts (~350 KB) only downloads when a chart is first opened
const StockChartModal = lazy(() => import("./StockChartModal"));
import PropTypes from "prop-types";
import usePortfolioData from "../hooks/usePortfolioData";
import usePortfolioActions from "../hooks/usePortfolioActions";

export default function PortfolioTable({
	activeTab,
	search,
	addOpen,
	setAddOpen,
	ltpMap,
	isConnected,
}) {
	const [selectedStock, setSelectedStock] = useState(null);
	const [chartStock, setChartStock] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [stockToDelete, setStockToDelete] = useState(null);
	const [actionType, setActionType] = useState("");
	const [stockId, setStockId] = useState("");
	const [maxSellQuantity, setMaxSellQuantity] = useState(0);
	const [stockName, setStockName] = useState("");
	const [sellHistory, setSellHistory] = useState([]);

	const {
		stocks,
		historyByStockId,
		activeStockMetrics,
		filteredStocks,
		isLoading,
		error,
	} = usePortfolioData({ activeTab, search });

	const { submitStockAction, deleteStockById } = usePortfolioActions({
		setAddOpen,
		setDeleteModalOpen,
	});

	// Initialize actionType when dialog opens from top "Add Stock" button
	useEffect(() => {
		if (addOpen && !stockId) {
			setActionType("add");
		}
	}, [addOpen, stockId]);

	// Reset state when dialog closes
	useEffect(() => {
		if (!addOpen) {
			setActionType("");
			setStockId("");
			setStockName("");
			setMaxSellQuantity(0);
			setSellHistory([]);
		}
	}, [addOpen]);

	const handleMutate = useCallback(
		(data) => {
			return submitStockAction({ actionType, stockId, data });
		},
		[actionType, stockId, submitStockAction],
	);

	const handleAddStock = useCallback(
		(row) => {
			setAddOpen(true);
			setStockId(row._id);
			setActionType("add");
			setStockName(row.stockName || "");
		},
		[setAddOpen],
	);

	const handleSellStock = useCallback(
		(id) => {
			const stock = stocks.find((s) => s._id === id);
			if (!stock) return;
			setAddOpen(true);
			setStockId(id);
			setActionType("sell");
			setMaxSellQuantity(stock.quantity);
			setStockName(stock.stockName || "");
			setSellHistory(historyByStockId[id] || []);
		},
		[stocks, historyByStockId, setAddOpen],
	);

	const handleViewHistory = useCallback(
		(stock) => {
			const filteredHistory = historyByStockId[stock._id] || [];
			setSelectedStock({ ...stock, history: filteredHistory });
		},
		[historyByStockId],
	);

	const handleDeleteStock = useCallback((stock) => {
		setStockToDelete(stock);
		setDeleteModalOpen(true);
	}, []);

	const handleConfirmDelete = useCallback(() => {
		if (stockToDelete) deleteStockById(stockToDelete._id);
	}, [stockToDelete, deleteStockById]);

	const handleCloseAddDialog = useCallback(() => {
		setAddOpen(false);
	}, [setAddOpen]);

	const handleCloseHistoryModal = useCallback(() => {
		setSelectedStock(null);
	}, []);

	const handleViewChart = useCallback(
		(stock) => {
			const history = historyByStockId[stock._id] || [];
			setChartStock({ ...stock, history });
		},
		[historyByStockId],
	);

	const handleCloseChart = useCallback(() => setChartStock(null), []);

	const handleChartAddMore = useCallback(() => {
		if (!chartStock) return;
		handleCloseChart();
		handleAddStock(chartStock);
	}, [chartStock, handleCloseChart, handleAddStock]);

	const handleChartSell = useCallback(() => {
		if (!chartStock) return;
		handleCloseChart();
		handleSellStock(chartStock._id);
	}, [chartStock, handleCloseChart, handleSellStock]);

	const handleCloseDeleteModal = useCallback(() => {
		setDeleteModalOpen(false);
	}, []);

	if (isLoading) return <Typography>Loading...</Typography>;
	if (error) return <Typography>Error loading stocks.</Typography>;

	return (
		<>
			<AddStock
				open={addOpen}
				mutateCall={handleMutate}
				handleClickCloseDialog={handleCloseAddDialog}
				nameInputField={stockId === ""}
				buttonLabel={actionType === "sell" ? "Sell" : "Add"}
				maxSellQuantity={actionType === "sell" ? maxSellQuantity : undefined}
				stockName={stockName}
				lotHistory={actionType === "sell" ? sellHistory : []}
			/>
			<PortfolioViewSwitch
				stocks={filteredStocks}
				activeTab={activeTab}
				historyByStockId={historyByStockId}
				activeStockMetrics={activeStockMetrics}
				ltpMap={ltpMap}
				isConnected={isConnected}
				onAdd={handleAddStock}
				onSell={handleSellStock}
				onViewHistory={handleViewHistory}
				onChart={handleViewChart}
				onDelete={handleDeleteStock}
			/>
			<StockHistoryModal
				open={!!selectedStock}
				onClose={handleCloseHistoryModal}
				stock={selectedStock ?? null}
				stockName={selectedStock?.stockName ?? ""}
				history={selectedStock?.history ?? []}
				ltpMap={ltpMap}
			/>
			<Suspense fallback={null}>
				<StockChartModal
					open={!!chartStock}
					onClose={handleCloseChart}
					stock={chartStock}
					history={chartStock?.history ?? []}
					ltpMap={ltpMap}
					activeStockMetrics={activeStockMetrics}
					onAddMore={handleChartAddMore}
					onSell={handleChartSell}
				/>
			</Suspense>
			{deleteModalOpen && stockToDelete && (
				<DeleteStockModal
					open={deleteModalOpen}
					onClose={handleCloseDeleteModal}
					onConfirm={handleConfirmDelete}
					stockName={stockToDelete.stockName}
				/>
			)}
		</>
	);
}

PortfolioTable.propTypes = {
	activeTab: PropTypes.number.isRequired,
	search: PropTypes.string.isRequired,
	addOpen: PropTypes.bool.isRequired,
	setAddOpen: PropTypes.func.isRequired,
	ltpMap: PropTypes.object.isRequired,
	isConnected: PropTypes.bool.isRequired,
};
