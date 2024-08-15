import CollapsibleTable from "./StockTable";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	fetchStockHistoryById,
	fetchStocks,
	handleAddStockRowInHistory,
	queryClient,
} from "../util/http.mjs";
import AddStock from "./AddStock";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/auth-slice";

export default function Portfolio() {
	const [isOpen, setIsOpen] = useState(false);
	const [stockId, setStockId] = useState("");
	// const [sessionActive, setSessionActive] = useState();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	let sessionStatus = useSelector((state) => state.auth.sessionActive);
	console.log(sessionStatus);

	useEffect(() => {
		if (!sessionStatus || sessionStatus === "expired") {
			localStorage.setItem("sessionActive", false);
			dispatch(logout({ sessionActive: "expired" }));
			navigate("/");
		}
	}, [navigate, sessionStatus, dispatch]);

	const { data, isLoading, error } = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		cacheTime: 10,
		staleTime: 10,
		onError: (error) => {
			if (!localStorage.getItem("token")) {
				localStorage.setItem("sessionActive", false);
				// setSessionActive(false);
				dispatch(logout());
				navigate("/");
			}
			console.error("Error fetching data:", error);
		},
	});

	const { data: historyRow } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
		// onError: (error) => {
		// 	if (!localStorage.getItem("token")) {
		// 		localStorage.setItem("sessionActive", false);
		// 		dispatch(logout());
		// 		navigate("/");
		// 	}
		// 	console.error("Error fetching data:", error);
		// },
		// staleTime: 3000,
	});

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
	if (data === false) {
		navigate("/");
		return null;
	}
	if (isLoading) return <p>Loading...</p>;
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
