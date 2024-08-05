import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@mui/material";
import PropTypes from "prop-types";
import { calculateStockAge, dateFormatter } from "../util/util.mjs";
HistoryTable.propTypes = {
	historyRow: PropTypes.arrayOf(
		PropTypes.shape({
			_id: PropTypes.string.isRequired,
			date: PropTypes.string.isRequired,
			stockId: PropTypes.string.isRequired,
			quantity: PropTypes.number.isRequired,
			avgPrice: PropTypes.number.isRequired,
			age: PropTypes.number,
			currPnl: PropTypes.number.isRequired,
			dateSold: PropTypes.string.isRequired,
			quantitySold: PropTypes.number.isRequired,
			sellingPrice: PropTypes.number.isRequired,
			pnl: PropTypes.number.isRequired,
		}).isRequired
	),
};

export default function HistoryTable({ historyRow }) {
	// console.log(historyRow);
	const sortedHistory = historyRow
		.slice()
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	return (
		<>
			<Table size="small" aria-label="purchases">
				<TableHead>
					<TableRow>
						<TableCell>Date Purchased</TableCell>
						<TableCell>Quantity</TableCell>
						<TableCell>Price</TableCell>
						<TableCell>Age(days)</TableCell>
						<TableCell>Curr. P&L</TableCell>
						<TableCell>Date Sold</TableCell>
						<TableCell>Quantity Sold</TableCell>
						<TableCell>Selling Price</TableCell>
						<TableCell>P&L</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{sortedHistory.map((history) => (
						<TableRow key={history._id}>
							<TableCell>{dateFormatter(history.date)}</TableCell>
							<TableCell>{history.quantity}</TableCell>
							<TableCell>{history.avgPrice}</TableCell>
							<TableCell>{calculateStockAge(history.date)}</TableCell>
							<TableCell>{history.currPnl}</TableCell>
							<TableCell>{history.dateSold}</TableCell>
							<TableCell>{history.quantitySold}</TableCell>
							<TableCell>{history.sellingPrice}</TableCell>
							<TableCell>{history.pnl}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</>
	);
}
