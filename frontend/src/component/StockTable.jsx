import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
	Box,
} from "@mui/material";
import StockTableRow from "./StockTableRow";
import PropTypes from "prop-types";

export default function StockTable({
	stocks,
	historyRows,
	activeTab,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	return (
		<TableContainer
			component={Paper}
			sx={{
				borderRadius: 3,
				boxShadow: "0 2px 8px 0 rgba(100,100,130,0.10)",
				mb: 4,
			}}
		>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell sx={{ fontWeight: "bold" }}>Stock</TableCell>
						<TableCell align="right" sx={{ fontWeight: "bold" }}>
							Quantity
						</TableCell>
						<TableCell align="right" sx={{ fontWeight: "bold" }}>
							Avg. Buy Price
						</TableCell>
						<TableCell align="right" sx={{ fontWeight: "bold" }}>
							Total Invested
						</TableCell>
						<TableCell align="right" sx={{ fontWeight: "bold" }}>
							LTP
						</TableCell>
						<TableCell align="right" sx={{ fontWeight: "bold" }}>
							Current Value
						</TableCell>
						<TableCell align="right" sx={{ fontWeight: "bold" }}>
							P&amp;L
						</TableCell>
						<TableCell align="center" sx={{ fontWeight: "bold" }}>
							Actions
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{stocks.length === 0 ? (
						<TableRow>
							<TableCell colSpan={8} align="center">
								<Box sx={{ py: 4, textAlign: "center" }}>
									<Typography variant="h6" color="text.secondary" gutterBottom>
										{activeTab === 0
											? "No active stocks in your portfolio"
											: "No dormant stocks"}
									</Typography>
									<Typography variant="body2" color="text.tertiary">
										{activeTab === 0
											? "Start by adding a stock to track your investments"
											: "Stocks become dormant when you sell all shares"}
									</Typography>
								</Box>
							</TableCell>
						</TableRow>
					) : (
						stocks.map((stock) => (
							<StockTableRow
								key={stock._id}
								stock={stock}
								historyRows={historyRows}
								activeTab={activeTab}
								onAdd={onAdd}
								onSell={onSell}
								onViewHistory={onViewHistory}
								onDelete={onDelete}
							/>
						))
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}

StockTable.propTypes = {
	stocks: PropTypes.arrayOf(PropTypes.object).isRequired,
	historyRows: PropTypes.arrayOf(PropTypes.object).isRequired,
	activeTab: PropTypes.number.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};
