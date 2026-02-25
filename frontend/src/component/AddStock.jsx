/* eslint-disable react/prop-types */
import { useEffect, useState, useRef } from "react";
import classes from "./AddStock.module.css";
import {
	Dialog,
	DialogContent,
	DialogActions,
	Button,
	TextField,
	List,
	ListItem,
	ListItemText,
	Box,
	Typography,
	Divider,
} from "@mui/material";
import instruments from "../../../backend/assets/instruments.json";

export default function AddStock({
	open,
	mutateCall,
	handleClickCloseDialog,
	nameInputField,
	buttonLabel = "Add",
	maxSellQuantity = Infinity,
	stockName = "",
}) {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [errors, setErrors] = useState({});
	const debounceTimeout = useRef();

	const handleClickClose = () => {
		setQuery("");
		setErrors({});
		handleClickCloseDialog();
	};

	useEffect(() => {
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		if (query) {
			debounceTimeout.current = setTimeout(() => {
				const filteredStocks = instruments.filter((stock) => {
					const nameMatch =
						stock.name &&
						stock.name.toLowerCase().includes(query.toLowerCase());
					const tradingSymbolMatch =
						stock.trading_symbol &&
						stock.trading_symbol.toLowerCase().includes(query.toLowerCase());
					return nameMatch || tradingSymbolMatch;
				});

				setSuggestions(filteredStocks);
			}, 300); // 300ms debounce
		} else {
			setSuggestions([]);
		}
		return () => clearTimeout(debounceTimeout.current);
	}, [query]);

	const validate = (data) => {
		const newErrors = {};
		if (nameInputField && (!data.stockName || data.stockName.trim() === "")) {
			newErrors.stockName = "Stock Name is required";
		}
		if (!data.quantity || isNaN(data.quantity) || Number(data.quantity) <= 0) {
			newErrors.quantity = "Quantity must be greater than 0";
		}
		if (!data.avgPrice || isNaN(data.avgPrice) || Number(data.avgPrice) <= 0) {
			newErrors.avgPrice = "Average Price must be greater than 0";
		}
		if (!data.date) {
			newErrors.date = "Date Purchased is required";
		}
		if (buttonLabel === "Sell" && Number(data.quantity) > maxSellQuantity) {
			newErrors.quantity = `Cannot sell more than available (${maxSellQuantity})`;
		}
		return newErrors;
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		const data = Object.fromEntries(formData);
		data.stockName ? (data.stockName = data.stockName.toUpperCase()) : null;
		data.avgPrice = parseFloat(data.avgPrice);
		const validationErrors = validate(data);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		mutateCall(data);
		event.target.reset();
		setQuery("");
		setSuggestions([]);
		handleClickClose();
	};

	const handleSelect = (stock) => {
		setQuery(stock.trading_symbol);
		setSuggestions([]);
		const inputElement = document.querySelector("input[name='quantity']");
		if (inputElement) inputElement.focus();
	};

	return (
		<Dialog
			open={open}
			onClose={handleClickClose}
			PaperProps={{
				sx: {
					p: 0,
					overflow: "hidden",
					borderRadius: "8px",
					boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
				},
			}}
		>
			<Box sx={{ backgroundColor: "#1976d2", color: "#fff", px: 2, py: 1.5 }}>
				<Typography variant="h6" fontWeight="bold">
					{buttonLabel === "Add"
						? `Add${stockName ? ` ${stockName}` : " Stock"}`
						: buttonLabel === "Sell"
						? `Sell${stockName ? ` ${stockName}` : " Stock"}`
						: "Stock Details"}
				</Typography>
			</Box>
			<Divider />
			<DialogContent sx={{ p: 3 }}>
				<form onSubmit={handleSubmit}>
					{nameInputField && (
						<Box position="relative" width="100%">
							<TextField
								name="stockName"
								label="Stock Name"
								placeholder="Stock Name"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								autoComplete="off"
								fullWidth
								margin="normal"
								error={!!errors.stockName}
								helperText={errors.stockName}
							/>
							{suggestions.length > 0 && (
								<List
									className={classes.suggestionsList}
									sx={{
										position: "absolute",
										top: "100%",
										left: 0,
										right: 0,
										zIndex: 10,
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
											onMouseDown={() => handleSelect(stock)}
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
						error={!!errors.quantity}
						helperText={errors.quantity}
						InputProps={
							buttonLabel === "Sell"
								? { inputProps: { min: 1, max: maxSellQuantity } }
								: undefined
						}
					/>
					{buttonLabel === "Sell" && (
						<Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
							Unsold shares available: <strong>{maxSellQuantity}</strong>
						</Typography>
					)}
					<TextField
						name="avgPrice"
						label="Average Price"
						placeholder="Buy Price"
						fullWidth
						margin="normal"
						error={!!errors.avgPrice}
						helperText={errors.avgPrice}
					/>
					<TextField
						name="date"
						type="date"
						label="Date Purchased"
						placeholder="Date Purchased"
						fullWidth
						margin="normal"
						InputLabelProps={{ shrink: true }}
						error={!!errors.date}
						helperText={errors.date}
					/>

					<DialogActions sx={{ mt: 2, justifyContent: "flex-end", gap: 1.5 }}>
						<Button
							variant="outlined"
							color="primary"
							onClick={handleClickClose}
							sx={{
								minWidth: 80,
								borderColor: "#1976d2",
								color: "#1976d2",
								"&:hover": {
									backgroundColor: "#f0f0f0",
									borderColor: "#1976d2",
								},
							}}
						>
							Cancel
						</Button>
						<Button
							variant="contained"
							type="submit"
							color={buttonLabel === "Sell" ? "warning" : "primary"}
							sx={{ minWidth: 80 }}
						>
							{buttonLabel}
						</Button>
					</DialogActions>
				</form>
			</DialogContent>
		</Dialog>
	);
}
