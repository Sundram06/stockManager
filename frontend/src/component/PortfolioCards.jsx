import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Typography, Box } from "@mui/material";
import AddStock from "./AddStock";
import StockHistoryModal from "./StockHistoryModal";
import DeleteStockModal from "./DeleteStockModal";
import {
	fetchStocks,
	fetchStockHistoryById,
	handleAddStockRowInHistory,
	handleSellStockRowInHistory,
	queryClient,
	API_URL,
} from "../util/http.mjs";
import { logout } from "../store/auth-slice";
import StocksList from "./StockList";

export default function PortfolioCards() {
	const [isOpen, setIsOpen] = useState(false);
	const [stockId, setStockId] = useState("");
	const [actionType, setActionType] = useState("");
	const [selectedStock, setSelectedStock] = useState(null);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [stockToDelete, setStockToDelete] = useState(null);
	const [maxSellQuantity, setMaxSellQuantity] = useState(0);
	const [stockName, setStockName] = useState(""); // <-- NEW
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const sessionStatus = useSelector((state) => state.auth.sessionActive);

	useEffect(() => {
		if (!sessionStatus || sessionStatus === "expired") {
			localStorage.setItem("sessionActive", false);
			dispatch(logout({ sessionActive: "expired" }));
			navigate("/");
		}
	}, [navigate, sessionStatus, dispatch]);

	const {
		data: stocks,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		cacheTime: 10,
		staleTime: 10,
	});

	const { data: historyRows } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
	});

	const { mutate: mutateAdd } = useMutation({
		mutationFn: handleAddStockRowInHistory,
		onSuccess: () => queryClient.invalidateQueries("history"),
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
		data.stockId = stockId;
		actionType === "add" ? mutateAdd(data) : mutateSell(data);
	};

	const handleAddStock = (row) => {
		setIsOpen(true);
		setStockId(row._id);
		setActionType("add");
		setStockName(row.stockName || ""); // <-- NEW
	};

	const handleSellStock = (id) => {
		const stock = sortedStocks.find((s) => s._id === id);
		setIsOpen(true);
		setStockId(id);
		setActionType("sell");
		setMaxSellQuantity(stock.quantity);
		setStockName(stock.stockName || ""); // <-- NEW
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

	if (isLoading) return <p>Loading...</p>;
	if (error) return <p>Error loading stocks.</p>;

	const sortedStocks = stocks?.slice().sort((a, b) => {
		const nameA = a.stockName.toUpperCase();
		const nameB = b.stockName.toUpperCase();
		return nameA.localeCompare(nameB);
	});

	const activeStocks = sortedStocks?.filter((stock) => stock.quantity > 0);
	const dormantStocks = sortedStocks?.filter((stock) => stock.quantity <= 0);

	return (
		<>
			<AddStock
				open={isOpen}
				mutateCall={handleMutate}
				handleClickCloseDialog={() => setIsOpen(false)}
				nameInputField={stockId === ""}
				buttonLabel={actionType === "sell" ? "Sell" : "Add"}
				maxSellQuantity={actionType === "sell" ? maxSellQuantity : undefined}
				stockName={stockName} // <-- NEW
			/>

			<Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh", p: 4 }}>
				<Typography variant="h4" align="center" gutterBottom>
					Stock Dashboard
				</Typography>

				{activeStocks?.length > 0 && (
					<StocksList
						title="Active Stocks"
						stocks={activeStocks}
						onAdd={handleAddStock}
						onSell={handleSellStock}
						onViewHistory={handleViewHistory}
						onDelete={handleDeleteStock}
						isDormant={false}
						// No need to pass historyRows here; only for dormant
					/>
				)}

				{dormantStocks?.length > 0 && (
					<StocksList
						title="Dormant Stocks"
						stocks={dormantStocks}
						onAdd={handleAddStock}
						onSell={handleSellStock}
						onViewHistory={handleViewHistory}
						onDelete={handleDeleteStock}
						isDormant={true}
						historyRows={historyRows}
						// pass all historyRows here so StockCard can filter per stock
					/>
				)}

				{stocks?.length === 0 && (
					<Typography>No stocks in portfolio.</Typography>
				)}
			</Box>

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

//asd11