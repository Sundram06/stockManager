import { useState, useEffect, useCallback } from "react";
import PortfolioViewSwitch from "./PortfolioViewSwitch";
import AddStock from "./AddStock";
import StockHistoryModal from "./StockHistoryModal";
import DeleteStockModal from "./DeleteStockModal";
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
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [stockToDelete, setStockToDelete] = useState(null);
	const [actionType, setActionType] = useState("");
	const [stockId, setStockId] = useState("");
	const [maxSellQuantity, setMaxSellQuantity] = useState(0);
	const [stockName, setStockName] = useState("");

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
		}
	}, [addOpen]);

	const handleMutate = useCallback(
		(data) => {
			submitStockAction({ actionType, stockId, data });
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
		},
		[stocks, setAddOpen],
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

	const handleCloseDeleteModal = useCallback(() => {
		setDeleteModalOpen(false);
	}, []);

	if (isLoading) return <p className="p-4 text-muted-foreground">Loading...</p>;
	if (error) return <p className="p-4 text-destructive">Error loading stocks.</p>;

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
				onDelete={handleDeleteStock}
			/>
			<StockHistoryModal
				open={!!selectedStock}
				onClose={handleCloseHistoryModal}
				stockName={selectedStock?.stockName ?? ""}
				history={selectedStock?.history ?? []}
			/>
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
