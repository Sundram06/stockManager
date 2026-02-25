import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { Typography } from "@mui/material";
import StockTable from "./StockTable";
import AddStock from "./AddStock";
import StockHistoryModal from "./StockHistoryModal";
import DeleteStockModal from "./DeleteStockModal";
import {
	fetchStocks,
	fetchStockHistoryById,
	createStock,
	handleSellStockRowInHistory,
	queryClient,
	API_URL,
} from "../util/http.mjs";
import { useDispatch } from "react-redux";
import { addStockToPortfolio } from "../store/stocks-slice";
import PropTypes from "prop-types";

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
		cacheTime: 10,
		staleTime: 10,
	});
	const { data: historyRows = [] } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
	});

	const { mutate: mutateAdd } = useMutation({
		mutationFn: createStock,
		onSuccess: (data) => {
			dispatch(addStockToPortfolio(data));
			queryClient.invalidateQueries("stocks");
			setAddOpen(false);
		},
	});
	const { mutate: mutateSell } = useMutation({
		mutationFn: handleSellStockRowInHistory,
		onSuccess: () => queryClient.invalidateQueries("history"),
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
			queryClient.invalidateQueries("stocks");
			queryClient.invalidateQueries("history");
			setDeleteModalOpen(false);
		},
	});

	const handleMutate = (data) => {
		if (actionType === "add") {
			console.log("add new stock", data);
			mutateAdd(data);
		} else if (actionType === "sell") {
			data.stockId = stockId;
			mutateSell(data);
		}
	};

	const handleAddStock = (row) => {
		setAddOpen(true);
		setStockId(row._id);
		setActionType("add");
		setStockName(row.stockName || "");
	};
	const handleSellStock = (id) => {
		const stock = stocks.find((s) => s._id === id);
		setAddOpen(true);
		setStockId(id);
		setActionType("sell");
		setMaxSellQuantity(stock.quantity);
		setStockName(stock.stockName || "");
	};
	const handleViewHistory = (stock) => {
		const filteredHistory =
			historyRows?.filter((row) => row.stockId === stock._id) || [];
		setSelectedStock({ ...stock, history: filteredHistory });
	};
	const handleDeleteStock = (stock) => {
		setStockToDelete(stock);
		setDeleteModalOpen(true);
	};
	const handleConfirmDelete = () => {
		if (stockToDelete) mutateDelete(stockToDelete._id);
	};

	// Filtering and sorting
	const sortedStocks = useMemo(() => {
		return stocks
			.slice()
			.sort((a, b) => (a.stockName || "").localeCompare(b.stockName || ""));
	}, [stocks]);
	const filteredStocks = useMemo(() => {
		return sortedStocks.filter(
			(stock) =>
				(activeTab === 0 ? stock.quantity > 0 : stock.quantity <= 0) &&
				(!search ||
					stock.stockName.toLowerCase().includes(search.toLowerCase())),
		);
	}, [sortedStocks, activeTab, search]);

	if (isLoading) return <Typography>Loading...</Typography>;
	if (error) return <Typography>Error loading stocks.</Typography>;

	return (
		<>
			<AddStock
				open={addOpen}
				mutateCall={handleMutate}
				handleClickCloseDialog={() => setAddOpen(false)}
				nameInputField={stockId === ""}
				buttonLabel={actionType === "sell" ? "Sell" : "Add"}
				maxSellQuantity={actionType === "sell" ? maxSellQuantity : undefined}
				stockName={stockName}
			/>
			<StockTable
				stocks={filteredStocks}
				historyRows={historyRows}
				activeTab={activeTab}
				onAdd={handleAddStock}
				onSell={handleSellStock}
				onViewHistory={handleViewHistory}
				onDelete={handleDeleteStock}
			/>
			{selectedStock && (
				<StockHistoryModal
					open={!!selectedStock}
					onClose={() => setSelectedStock(null)}
					stockName={selectedStock.stockName}
					history={selectedStock.history}
				/>
			)}
			{deleteModalOpen && stockToDelete && (
				<DeleteStockModal
					open={deleteModalOpen}
					onClose={() => setDeleteModalOpen(false)}
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
