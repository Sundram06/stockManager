import PropTypes from "prop-types";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Modal,
	Box,
	Typography,
	IconButton,
	TableContainer,
	Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { dateFormatter } from "../util/util.mjs";

const modalStyle = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: "90%",
	maxWidth: 700,
	bgcolor: "background.paper",
	boxShadow: 24,
	p: 3,
	borderRadius: 2,
};

export default function StockHistoryModal({
	open,
	onClose,
	stockName,
	history,
}) {
	const sortedHistory = history
		.slice()
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	return (
		<Modal open={open} onClose={onClose}>
			<Box sx={modalStyle}>
				{/* Header */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 2,
						borderBottom: "1px solid #ddd",
						pb: 1,
					}}
				>
					<Typography variant="h6" fontWeight="bold">
						{stockName} History
					</Typography>
					<IconButton onClick={onClose} aria-label="Close">
						<CloseIcon />
					</IconButton>
				</Box>

				{/* Table */}
				<TableContainer component={Paper} elevation={0}>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: "#f5f5f5" }}>
								<TableCell>Date Purchased</TableCell>
								<TableCell>Quantity</TableCell>
								<TableCell>Price</TableCell>
								<TableCell>Date Sold</TableCell>
								<TableCell>Quantity Sold</TableCell>
								<TableCell>Selling Price</TableCell>
								<TableCell>P&L</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedHistory.map((history, index) => (
								<TableRow
									key={history._id}
									sx={{
										backgroundColor: index % 2 === 0 ? "#fafafa" : "inherit",
									}}
								>
									<TableCell>{dateFormatter(history.date)}</TableCell>
									<TableCell>{history.quantity}</TableCell>
									<TableCell>
										{history.avgPrice !== undefined
											? parseFloat(history.avgPrice).toFixed(2)
											: "—"}
									</TableCell>
									<TableCell>
										{history.dateSold ? dateFormatter(history.dateSold) : "—"}
									</TableCell>
									<TableCell>{history.quantitySold || "—"}</TableCell>
									<TableCell>
										{history.sellingPrice !== undefined
											? parseFloat(history.sellingPrice).toFixed(2)
											: "—"}
									</TableCell>
									<TableCell
										style={{
											color:
												history.pnl > 0
													? "green"
													: history.pnl < 0
													? "red"
													: "inherit",
											fontWeight: "bold",
										}}
									>
										{history.pnl !== undefined
											? parseFloat(history.pnl).toFixed(2)
											: "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</Modal>
	);
}

StockHistoryModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	stockName: PropTypes.string.isRequired,
	history: PropTypes.array.isRequired,
};
