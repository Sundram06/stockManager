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
import { useNavigate } from "react-router-dom";
// import { Table } from "@mui/material";

export default function Portfolio() {
	// const stocks = useSelector((state) => state.stocks);
	// console.log(stocks);
	const [isOpen, setIsOpen] = useState(false);
	const [stockId, setStockId] = useState("");
	const navigate = useNavigate();
	const { data, isLoading, error } = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		// onError: (error) => {
		// 	if (
		// 		error.message === "Token expired" ||
		// 		error.message.includes("Unauthorized")
		// 	) {
		// 		navigate("/"); // Redirect to login page on token expiration
		// 	}
		// },
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

	// useEffect(() => {
	// 	if (error || data === false) {
	// 		navigate("/"); // Redirect if there's an error or if data is false
	// 	}
	// }, [error, data]);
	if (data === false) {
		navigate("/");
		return null;
	}
	if (isLoading) return <p>Loading...</p>;
	// if (error) {
	// 	navigate("/");
	// 	return null;
	// }
	if (!data || error) return null;
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
