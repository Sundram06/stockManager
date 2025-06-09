import PropTypes from "prop-types";
import {
	Paper,
	Typography,
	Button,
	Stack,
	IconButton,
	Box,
	Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import BarChartIcon from "@mui/icons-material/BarChart";

export default function StockCard({
	stock,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	const totalCost = (stock.quantity * stock.avgPrice).toFixed(2);

	return (
		<Paper
			elevation={3}
			sx={{
				p: 2,
				width: 280,
				borderRadius: 2,
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				position: "relative",
				backgroundColor: "#ffffff",
				boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
				borderTop: "4px solid #1976d2", // Primary theme color
			}}
		>
			{/* Stock name container with delete icon */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					backgroundColor: "#f4f6f8", // Soft gray
					borderRadius: "4px",
					py: 1,
					px: 2,
					mb: 1,
				}}
			>
				<Typography
					variant="subtitle1"
					fontWeight="bold"
					sx={{ color: "#333" }}
				>
					{stock.stockName}
				</Typography>
				<IconButton
					onClick={() => onDelete(stock)}
					sx={{
						backgroundColor: "#ffffff",
						"&:hover": {
							backgroundColor: "#f0f0f0",
						},
						p: "4px",
					}}
					aria-label="delete"
					size="small"
				>
					<DeleteIcon fontSize="small" color="error" />
				</IconButton>
			</Box>

			<Divider sx={{ mb: 1 }} />

			<Typography variant="body2">Quantity: {stock.quantity}</Typography>
			<Typography variant="body2" color="text.secondary">
				Avg. Cost: ₹{stock.avgPrice}
			</Typography>
			<Typography variant="body2" color="text.secondary">
				Total Cost: ₹{totalCost}
			</Typography>
			<Typography
				variant="body2"
				sx={{ color: stock.pnl >= 0 ? "green" : "red", fontWeight: "bold" }}
			>
				P&L: ₹{stock.pnl}
			</Typography>
			<Typography variant="body2" color="text.secondary">
				LTP: ₹{stock.ltp}
			</Typography>
			<Typography variant="body2" color="text.secondary">
				Curr. Val: ₹{stock.currVal}
			</Typography>

			<Stack direction="row" spacing={1} mt={2} justifyContent="center">
				<Button
					variant="contained"
					color="primary"
					size="small"
					startIcon={<AddIcon />}
					onClick={() => onAdd(stock)}
					sx={{ minWidth: 80 }}
				>
					ADD
				</Button>
				<Button
					variant="contained"
					color="warning"
					size="small"
					startIcon={<RemoveIcon />}
					onClick={() => onSell(stock._id)}
					sx={{ minWidth: 80 }}
				>
					SELL
				</Button>
				<Button
					variant="outlined"
					color="primary"
					size="small"
					startIcon={<BarChartIcon />}
					onClick={() => onViewHistory(stock)}
					sx={{ minWidth: 80 }}
				>
					HISTORY
				</Button>
			</Stack>
		</Paper>
	);
}

StockCard.propTypes = {
	stock: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};
