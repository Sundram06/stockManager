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
import { API_URL } from "../util/api/config.mjs";

// Computes how many unsold shares were available as of a given date string "YYYY-MM-DD".
function computeAvailableQty(lotHistory, dateStr) {
	if (!dateStr || !lotHistory?.length) return 0;
	const cutoff = new Date(dateStr);
	cutoff.setHours(23, 59, 59, 999);
	return lotHistory.reduce((sum, row) => {
		const lotDate = new Date(row.date);
		if (lotDate <= cutoff) {
			sum += (row.quantity || 0) - (row.quantitySold || 0);
		}
		return sum;
	}, 0);
}

export default function AddStock({
	open,
	mutateCall,
	handleClickCloseDialog,
	nameInputField,
	buttonLabel = "Add",
	maxSellQuantity = Infinity,
	stockName = "",
	lotHistory = [],
}) {
	const theme = useTheme();
	const isSell = buttonLabel === "Sell";
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState([]);
	const [errors, setErrors] = useState({});
	const [purchaseDate, setPurchaseDate] = useState(null);
	const [selectedInstrumentKey, setSelectedInstrumentKey] = useState("");

	// For sell mode: effective max qty based on selected sell date
	const effectiveMaxQty = isSell && purchaseDate && lotHistory.length
		? computeAvailableQty(lotHistory, dayjs(purchaseDate).format("YYYY-MM-DD"))
		: maxSellQuantity;
	const debounceTimeout = useRef();
	const justSelected = useRef(false);
	const searchEndpoint = API_URL
		? `${API_URL}/api/instruments/search`
		: "/api/instruments/search";

	const handleClickClose = () => {
		setQuery("");
		setErrors({});
		setPurchaseDate(null);
		setSelectedInstrumentKey("");
		setSuggestions([]);
		handleClickCloseDialog();
	};

	useEffect(() => {
		if (justSelected.current) {
			justSelected.current = false;
			return;
		}
		if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
		if (query && query.length >= 2) {
			debounceTimeout.current = setTimeout(() => {
				fetch(`${searchEndpoint}?q=${encodeURIComponent(query)}`)
					.then((res) => res.ok ? res.json() : [])
					.then((data) => setSuggestions(Array.isArray(data) ? data : []))
					.catch(() => setSuggestions([]));
			}, 300);
		} else {
			setSuggestions([]);
		}
		return () => clearTimeout(debounceTimeout.current);
	}, [query, searchEndpoint]);

	const validate = (data) => {
		const newErrors = {};
		if (nameInputField && (!data.stockName || data.stockName.trim() === "")) {
			newErrors.stockName = "Stock Name is required";
		}
		if (nameInputField && data.stockName && !selectedInstrumentKey) {
			newErrors.stockName = "Please select a stock from the suggestions";
		}
		if (!data.date) {
			newErrors.date = isSell ? "Sell date is required" : "Date Purchased is required";
		}
		if (!data.quantity || isNaN(data.quantity) || Number(data.quantity) <= 0) {
			newErrors.quantity = "Quantity must be greater than 0";
		}
		if (!data.avgPrice || isNaN(data.avgPrice) || Number(data.avgPrice) <= 0) {
			newErrors.avgPrice = "Average Price must be greater than 0";
		}
		if (isSell && data.date && Number(data.quantity) > effectiveMaxQty) {
			newErrors.quantity = `Only ${effectiveMaxQty} shares available to sell as of this date`;
		}
		if (isSell && data.date && effectiveMaxQty <= 0) {
			newErrors.date = "No shares available to sell on or before this date";
		}
		return newErrors;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const formData = new FormData(event.target);
		const data = Object.fromEntries(formData);
		data.date = purchaseDate ? dayjs(purchaseDate).format("YYYY-MM-DD") : "";
		data.stockName ? (data.stockName = data.stockName.toUpperCase()) : null;
		data.avgPrice = parseFloat(data.avgPrice);
		if (selectedInstrumentKey) data.instrumentKey = selectedInstrumentKey;
		const validationErrors = validate(data);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}
		try {
			await mutateCall(data);
			event.target.reset();
			setQuery("");
			setSelectedInstrumentKey("");
			setPurchaseDate(null);
			setSuggestions([]);
			setErrors({});
			handleClickClose();
		} catch (err) {
			setErrors({ api: err?.message || "Something went wrong. Please try again." });
		}
	};

	const handleSelect = (stock) => {
		justSelected.current = true;
		setQuery(stock.trading_symbol);
		setSelectedInstrumentKey(stock.instrument_key || "");
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
								onChange={(e) => {
									setQuery(e.target.value);
									setSelectedInstrumentKey("");
								}}
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
										"&::-webkit-scrollbar": { width: 8 },
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
												"&:last-of-type": { borderBottom: "none" },
												"&:hover": { backgroundColor: "action.hover" },
											}}
										>
											<ListItemText
												primary={`${stock.name} ${stock.trading_symbol ? `(${stock.trading_symbol})` : ""}`}
												primaryTypographyProps={{
													variant: "body2",
													sx: { color: "text.primary", fontWeight: 500, lineHeight: 1.35 },
												}}
											/>
										</ListItem>
									))}
								</List>
							)}
						</Box>
					)}

					{/* In sell mode: date comes first so available qty can be computed */}
					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<DatePicker
							label={isSell ? "Sell Date" : "Date Purchased"}
							value={purchaseDate}
							onChange={(newValue) => {
								setPurchaseDate(newValue);
								setErrors((prev) => ({ ...prev, date: undefined, quantity: undefined }));
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
							isSell
								? { inputProps: { min: 1, max: effectiveMaxQty } }
								: undefined
						}
					/>
					{isSell && (
						<Typography variant="caption" color="textSecondary" sx={{ mb: 1 }}>
							{purchaseDate
								? `Available to sell as of this date: `
								: `Total unsold shares: `}
							<strong>
								{purchaseDate ? effectiveMaxQty : maxSellQuantity}
							</strong>
						</Typography>
					)}

					<TextField
						name="avgPrice"
						type="number"
						label={isSell ? "Sell Price" : "Average Price"}
						placeholder={isSell ? "Sell Price" : "Buy Price"}
						fullWidth
						margin="normal"
						error={!!errors.avgPrice}
						helperText={errors.avgPrice}
						InputProps={{ inputProps: { min: 0.01, step: "any" } }}
					/>

					{errors.api && (
						<Box sx={{ mt: 2, px: 0.5 }}>
							<Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
								{errors.api}
							</Typography>
						</Box>
					)}

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
