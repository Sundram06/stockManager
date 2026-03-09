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
import { memo } from "react";
import StockTableRow from "./StockTableRow";
import PropTypes from "prop-types";

function StockTable({
	stocks,
	activeTab,
	historyByStockId,
	activeStockMetrics,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
}) {
	return (
		<TableContainer
			component={Paper}
			elevation={2}
			sx={{
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
								activeTab={activeTab}
								historyByStockId={historyByStockId}
								activeStockMetrics={activeStockMetrics}
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
	activeTab: PropTypes.number.isRequired,
	historyByStockId: PropTypes.object.isRequired,
	activeStockMetrics: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};

const MemoizedStockTable = memo(StockTable);

export default MemoizedStockTable;
