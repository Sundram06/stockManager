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
import { useTheme } from "@mui/material/styles";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { API_URL } from "../util/http.mjs";

export default function AddStock({
	open,
	mutateCall,
	handleClickCloseDialog,
	nameInputField,
	buttonLabel = "Add",
	maxSellQuantity = Infinity,
	stockName = "",
}) {
	const theme = useTheme();
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [errors, setErrors] = useState({});
	const [purchaseDate, setPurchaseDate] = useState(null);
	const debounceTimeout = useRef();
	const [instruments, setInstruments] = useState([]);
	const [instrumentsLoading, setInstrumentsLoading] = useState(false);
	const instrumentsEndpoint = API_URL
		? `${API_URL}/api/instruments`
		: "/api/instruments";

	// Fetch instruments on component mount or when dialog opens
	useEffect(() => {
		if (open && instruments.length === 0 && !instrumentsLoading) {
			setInstrumentsLoading(true);
			fetch(instrumentsEndpoint)
				.then((res) => {
					if (!res.ok) {
						throw new Error("Failed to fetch instruments");
					}
					return res.json();
				})
				.then((data) => {
					setInstruments(data);
					setInstrumentsLoading(false);
				})
				.catch((err) => {
					console.error("Error fetching instruments:", err);
					setInstrumentsLoading(false);
				});
		}
	}, [open, instruments.length, instrumentsLoading, instrumentsEndpoint]);

	const handleClickClose = () => {
		setQuery("");
		setErrors({});
		setPurchaseDate(null);
		handleClickCloseDialog();
	};

	useEffect(() => {
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		if (query) {
			debounceTimeout.current = setTimeout(() => {
				const normalizedQuery = query.toLowerCase();
				const filteredStocks = instruments.filter((stock) => {
					const nameMatch =
						stock.name && stock.name.toLowerCase().includes(normalizedQuery);
					const tradingSymbolMatch =
						stock.trading_symbol &&
						stock.trading_symbol.toLowerCase().includes(normalizedQuery);
					return nameMatch || tradingSymbolMatch;
				});

				setSuggestions(filteredStocks);
			}, 300); // 300ms debounce
		} else {
			setSuggestions([]);
		}
		return () => clearTimeout(debounceTimeout.current);
	}, [query, instruments]);

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
		data.date = purchaseDate ? dayjs(purchaseDate).format("YYYY-MM-DD") : "";
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
		setPurchaseDate(null);
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
					borderRadius: "0.5rem",
				},
			}}
		>
			<Box sx={{ backgroundColor: "primary.main", color: "primary.contrastText", px: 2, py: 1.5 }}>
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
										zIndex: 20,
										mt: 0.5,
										p: 0,
										borderRadius: "0.5rem",
										backgroundColor: "background.paper",
										border: "1px solid",
										borderColor: "divider",
										boxShadow: (theme) => theme.shadows[8],
										maxHeight: "200px",
										overflowY: "auto",
										"&::-webkit-scrollbar": {
											width: 8,
										},
										"&::-webkit-scrollbar-thumb": {
											backgroundColor: "text.disabled",
											borderRadius: 8,
										},
									}}
								>
									{suggestions.map((stock, index) => (
										<ListItem
											button
											key={index}
											onMouseDown={() => handleSelect(stock)}
											sx={{
												py: 0.9,
												px: 1.25,
												borderBottom: "1px solid",
												borderColor: "divider",
												"&:last-of-type": {
													borderBottom: "none",
												},
												"&:hover": {
													backgroundColor: "action.hover",
												},
											}}
										>
											<ListItemText
												primary={`${stock.name} ${
													stock.trading_symbol
														? `(${stock.trading_symbol})`
														: ""
												}`}
												primaryTypographyProps={{
													variant: "body2",
													sx: {
														color: "text.primary",
														fontWeight: 500,
														lineHeight: 1.35,
													},
												}}
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
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label="Date Purchased"
							value={purchaseDate}
							onChange={(newValue) => {
								setPurchaseDate(newValue);
								if (errors.date) {
									setErrors((prev) => ({ ...prev, date: undefined }));
								}
							}}
							slotProps={{
								textField: {
									name: "date",
									fullWidth: true,
									margin: "normal",
									error: !!errors.date,
									helperText: errors.date,
								},
								desktopPaper: {
									sx: {
										backgroundColor: theme.palette.background.paper,
										color: theme.palette.text.primary,
										border: `1px solid ${theme.palette.divider}`,
									},
								},
								mobilePaper: {
									sx: {
										backgroundColor: theme.palette.background.paper,
										color: theme.palette.text.primary,
										border: `1px solid ${theme.palette.divider}`,
									},
								},
							}}
						/>
					</LocalizationProvider>

					<DialogActions sx={{ mt: 2, justifyContent: "flex-end", gap: 1.5 }}>
						<Button
							variant="outlined"
							color="primary"
							onClick={handleClickClose}
							sx={{
								minWidth: 80,
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
