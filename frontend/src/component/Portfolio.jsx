// import { useSelector } from "react-redux";
// import classes from "./Portfolio.module.css";
// import CollapsibleTable from "./DemoTable.jsx";
import CollapsibleTable from "./StockTable";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	fetchStockHistoryById,
	fetchStocks,
	handleAddStockRowInHistory,
	queryClient,
} from "../util/http.mjs";
import AddStock from "./AddStock";
import { useState } from "react";
// import { Table } from "@mui/material";

export default function Portfolio() {
	// const stocks = useSelector((state) => state.stocks);
	// console.log(stocks);
	const [isOpen, setIsOpen] = useState(false);
	const [stockId, setStockId] = useState("");
	const { data, isLoading, error } = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		// staleTime: 3000,
	});

	const { data: historyRow } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
		// staleTime: 3000,
	});
	// console.log(data);
	// console.log("HISTORY");
	// console.log(historyRow);

	const { mutate: mutateAddStockRowInHistory } = useMutation({
		mutationFn: handleAddStockRowInHistory,
		mutationKey: ["history"],

		onSuccess: () => {
			console.log("inside onsuccess");
			queryClient.invalidateQueries("history");
		},
		onError: (error) => {
			throw new Error("Failed to add history entry of stock ", {
				cause: error,
			});
		},
	});
	const mutateCall = (data) => {
		data.stockId = stockId;
		console.log(data.stockId);
		console.log("inside mutateCall2", data);
		mutateAddStockRowInHistory(data);
	};
	const handleAddStockInHistory = (row) => {
		setIsOpen(true);
		setStockId(row._id);
		// mutateAddStockRowInHistory();
		console.log("add stock in history by id", row._id);
	};
	const handleClickCloseDialog = () => {
		setIsOpen(false);
	};
	const handleSellStock = (id) => {
		console.log("sell stock by id", id);
	};

	if (isLoading) return <p>Loading...</p>;
	if (error) return <p>Error loading stocks</p>;

	return (
		<>
			<AddStock
				open={isOpen}
				mutateCall={mutateCall}
				handleClickCloseDialog={handleClickCloseDialog}
				nameInputField={false}
			/>
			{data.length == 0 && <p>No stocks in portfolio</p>}
			{data.length > 0 && (
				<CollapsibleTable
					data={data}
					historyRow={historyRow}
					onAdd={handleAddStockInHistory}
					onSell={handleSellStock}
				/>
			)}
		</>
	);
}
