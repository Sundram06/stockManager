import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Typography } from "@mui/material";
import StockTable from "./StockTable";
import AddStock from "./AddStock";
import StockHistoryModal from "./StockHistoryModal";
import DeleteStockModal from "./DeleteStockModal";
import {
	fetchStocks,
	fetchStockHistoryById,
	createStock,
	handleAddStockRowInHistory,
	handleSellStockRowInHistory,
	queryClient,
	API_URL,
} from "../util/http.mjs";
import { useDispatch } from "react-redux";
import { addStockToPortfolio } from "../store/stocks-slice";
import PropTypes from "prop-types";

const QUERY_STALE_TIME = 60 * 1000;
const QUERY_GC_TIME = 5 * 60 * 1000;

export default function PortfolioTable({
	activeTab,
	search,
	addOpen,
	setAddOpen,
}) {
	const dispatch = useDispatch();
	const [selectedStock, setSelectedStock] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [stockToDelete, setStockToDelete] = useState(null);
	const [actionType, setActionType] = useState("");
	const [stockId, setStockId] = useState("");
	const [maxSellQuantity, setMaxSellQuantity] = useState(0);
	const [stockName, setStockName] = useState("");

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

	const {
		data: stocks = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		staleTime: QUERY_STALE_TIME,
		gcTime: QUERY_GC_TIME,
		refetchOnWindowFocus: false,
	});
	const { data: historyRows = [] } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
		staleTime: QUERY_STALE_TIME,
		gcTime: QUERY_GC_TIME,
		refetchOnWindowFocus: false,
	});

	const { mutate: mutateAdd } = useMutation({
		mutationFn: createStock,
		onSuccess: (data) => {
			dispatch(addStockToPortfolio(data));
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
			setAddOpen(false);
		},
	});
	const { mutate: mutateAddToHistory } = useMutation({
		mutationFn: handleAddStockRowInHistory,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
			setAddOpen(false);
		},
	});
	const { mutate: mutateSell } = useMutation({
		mutationFn: handleSellStockRowInHistory,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
	});
	const { mutate: mutateDelete } = useMutation({
		mutationFn: async (stockId) => {
			const token = localStorage.getItem("token");
			const response = await fetch(`${API_URL}/stocks/${stockId}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error("Failed to delete stock");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["stocks"] });
			queryClient.invalidateQueries({ queryKey: ["history"] });
			setDeleteModalOpen(false);
		},
	});

	const handleMutate = useCallback(
		(data) => {
			if (actionType === "add") {
				if (stockId) {
					mutateAddToHistory({ ...data, stockId });
				} else {
					mutateAdd(data);
				}
			} else if (actionType === "sell") {
				data.stockId = stockId;
				mutateSell(data);
			}
		},
		[actionType, stockId, mutateAddToHistory, mutateAdd, mutateSell],
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

	// Pre-aggregate history by stockId to ensure single source of truth for calculations
	const historyByStockId = useMemo(() => {
		const map = {};
		historyRows.forEach((row) => {
			if (!map[row.stockId]) {
				map[row.stockId] = [];
			}
			map[row.stockId].push(row);
		});
		return map;
	}, [historyRows]);

	// Compute aggregated metrics for active stocks from history data
	const activeStockMetrics = useMemo(() => {
		const metrics = {};
		stocks.forEach((stock) => {
			if (stock.quantity > 0) {
				const stockHistory = historyByStockId[stock._id] || [];
				let totalQty = 0;
				let totalCost = 0;

				stockHistory.forEach((row) => {
					const unsoldQty = (row.quantity || 0) - (row.quantitySold || 0);
					if (unsoldQty > 0) {
						totalQty += unsoldQty;
						totalCost += unsoldQty * (row.avgPrice || 0);
					}
				});

				metrics[stock._id] = {
					totalInvested: totalCost,
					avgPrice: totalQty > 0 ? totalCost / totalQty : stock.avgPrice,
				};
			}
		});
		return metrics;
	}, [stocks, historyByStockId]);

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
		if (stockToDelete) mutateDelete(stockToDelete._id);
	}, [stockToDelete, mutateDelete]);

	const handleCloseAddDialog = useCallback(() => {
		setAddOpen(false);
	}, [setAddOpen]);

	const handleCloseHistoryModal = useCallback(() => {
		setSelectedStock(null);
	}, []);

	const handleCloseDeleteModal = useCallback(() => {
		setDeleteModalOpen(false);
	}, []);

	// Filtering and sorting
	const sortedStocks = useMemo(() => {
		return stocks
			.slice()
			.sort((a, b) => (a.stockName || "").localeCompare(b.stockName || ""));
	}, [stocks]);

	const normalizedSearch = useMemo(() => search.toLowerCase(), [search]);

	const filteredStocks = useMemo(() => {
		return sortedStocks.filter(
			(stock) =>
				(activeTab === 0 ? stock.quantity > 0 : stock.quantity <= 0) &&
				(!normalizedSearch ||
					stock.stockName.toLowerCase().includes(normalizedSearch)),
		);
	}, [sortedStocks, activeTab, normalizedSearch]);

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
			/>
			<StockTable
				stocks={filteredStocks}
				activeTab={activeTab}
				historyByStockId={historyByStockId}
				activeStockMetrics={activeStockMetrics}
				onAdd={handleAddStock}
				onSell={handleSellStock}
				onViewHistory={handleViewHistory}
				onDelete={handleDeleteStock}
			/>
			{selectedStock && (
				<StockHistoryModal
					open={!!selectedStock}
					onClose={handleCloseHistoryModal}
					stockName={selectedStock.stockName}
					history={selectedStock.history}
				/>
			)}
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
};
