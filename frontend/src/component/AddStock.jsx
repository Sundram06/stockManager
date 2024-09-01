/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import classes from "./AddStock.module.css";
import {
	Dialog,
	Button,
	DialogActions,
	TextField,
	List,
	ListItem,
	ListItemText,
	Box,
} from "@mui/material";
import instruments from "../../../backend/instruments.json";
export default function AddStock({
	open,
	mutateCall,
	handleClickCloseDialog,
	nameInputField,
}) {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);

	const handleClickClose = () => {
		setQuery("");
		handleClickCloseDialog();
	};

	useEffect(() => {
		if (query) {
			const filteredStocks = instruments.filter((stock) => {
				const nameMatch =
					stock.name && stock.name.toLowerCase().includes(query.toLowerCase());
				// const shortNameMatch =
				// 	stock.short_name &&
				// 	stock.short_name.toLowerCase().includes(query.toLowerCase());
				const tradingSymbolMatch =
					stock.trading_symbol &&
					stock.trading_symbol.toLowerCase().includes(query.toLowerCase());
				return nameMatch || tradingSymbolMatch;
			});
			// .slice(0, 5);
			setSuggestions(filteredStocks);
		} else {
			setSuggestions([]);
		}
	}, [query]);

	const handleSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		console.log(event.target);
		console.log(formData);
		const data = Object.fromEntries(formData);
		data.stockName ? (data.stockName = data.stockName.toUpperCase()) : null;
		data.avgPrice = parseFloat(data.avgPrice);
		console.log("inside handleSubmit");
		console.log(data);
		mutateCall(data);
		event.target.reset();
		setQuery("");
		setSuggestions([]);
		handleClickClose();
	};

	const handleSelect = (stock) => {
		setQuery(stock.trading_symbol);
		console.log("trading_symbol", stock.trading_symbol);
		setSuggestions([]);
		const inputElement = document.querySelector("input[name='quantity']");
		if (inputElement) {
			inputElement.focus(); // Highlighted Change: This line ensures the input field is focused after selection
		}
	};

	return (
		<>
			<Dialog
				className={classes.dialog}
				open={open}
				onClose={handleClickClose}
				BackdropProps={{
					classes: {
						root: classes.backdrop,
					},
				}}
			>
				<div>
					<form className={classes.dialogContent} onSubmit={handleSubmit}>
						<h2>Stock Details</h2>
						{nameInputField && (
							<Box position="relative" width="100%" style={{ minWidth: "0px" }}>
								<TextField
									name="stockName"
									label="Stock Name"
									placeholder="Stock Name"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									autoComplete="off"
									fullWidth
									margin="normal"
								/>
								{suggestions.length > 0 && (
									<List
										className={classes.suggestionsList}
										style={{
											position: "absolute",
											top: "100%",
											left: 0,
											right: 0,
											zIndex: 10, // Ensure it appears on top of other elements
											backgroundColor: "white",
											boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
											maxHeight: "200px",
											overflowY: "auto",
										}}
									>
										{suggestions.map((stock, index) => (
											<ListItem
												button
												key={index}
												onClick={() => handleSelect(stock)}
											>
												<ListItemText
													primary={`${stock.name} ${
														stock.trading_symbol
															? `(${stock.trading_symbol})`
															: ""
													}`}
												/>
											</ListItem>
										))}
									</List>
								)}
							</Box>
						)}
						<TextField
							name="quantity"
							type="number"
							label="Quantity"
							placeholder="Quantity"
							fullWidth
							margin="normal"
						/>
						<TextField
							name="avgPrice"
							label="Average Price"
							placeholder="Buy Price"
							fullWidth
							margin="normal"
						/>
						<TextField
							name="date"
							type="date"
							label="Date Purchased"
							placeholder="Date Purchased"
							fullWidth
							margin="normal"
							InputLabelProps={{ shrink: true }} // Ensures the label shrinks when a value is present
						/>
						<DialogActions>
							<Button variant="contained" type="submit">
								Add
							</Button>
							<Button onClick={handleClickClose} type="reset">
								Cancel
							</Button>
						</DialogActions>
					</form>
				</div>
			</Dialog>
		</>
	);
}
