import { Button, TextField } from "@mui/material";
import classes from "./AddStock.module.css";
import AddStock from "./AddStock";
import {
	createStock,
	deleteAllStocks,
	logoutUser,
	queryClient,
} from "../util/http.mjs";
import { useMutation } from "@tanstack/react-query";
import { addStockToPortfolio } from "../store/stocks-slice";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/auth-slice";

// eslint-disable-next-line react/prop-types
export default function StockToolbar() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);

	const handleClickOpen = () => {
		setIsOpen(true);
	};

	const handleClickCloseDialog = () => {
		setIsOpen(false);
	};

	const mutateCall = (data) => {
		console.log("inside mutateCall", data);
		mutate(data);
	};

	const { mutate } = useMutation({
		mutationFn: createStock,
		mutationKey: ["stocks"],
		onSuccess: (data) => {
			console.log("inside onsuccess");
			dispatch(addStockToPortfolio(data));
			queryClient.invalidateQueries("stocks");
			handleClickCloseDialog();
		},
		onError: (error) => {
			throw new Error("Failed to do stocks entry", {
				cause: error,
			});
		},
	});

	const { mutate: mutateDeleteAll } = useMutation({
		mutationFn: deleteAllStocks,
		mutationKey: ["stocks"],

		onSuccess: () => {
			console.log("All stocks and history deleted");
			queryClient.invalidateQueries("stocks");
		},
		onError: (error) => {
			throw new Error("Failed to delete all stocks and history", {
				cause: error,
			});
		},
	});

	const handleLogout = () => {
		logoutUser();
		dispatch(logout({ sessionActive: "loggedout" }));
		navigate("/");
	};

	const handleDeleteAll = () => {
		mutateDeleteAll();
	};

	return (
		<>
			<AddStock
				open={isOpen}
				mutateCall={mutateCall}
				handleClickCloseDialog={handleClickCloseDialog}
				nameInputField={true}
			/>
			<div className={classes.addStock}>
				<TextField
					variant="outlined"
					size="small"
					type="search"
					name="Search"
					placeholder="Search"
					className={classes.searchBar}
				/>
				<Button
					variant="outlined"
					// className={classes.addButton}
					onClick={handleClickOpen}
				>
					+
				</Button>
				<Button variant="contained" color="primary" onClick={handleLogout}>
					Logout
				</Button>
				<Button onClick={handleDeleteAll} variant="contained">
					Delete All
				</Button>
			</div>
		</>
	);
}
