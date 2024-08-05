// CollapsibleTable.js
import PropTypes from "prop-types";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Row from "./Row";

const CollapsibleTable = ({ data, historyRow, onAdd, onSell }) => {
	console.log("table data : ", data);
	console.log("history data table ", historyRow);

	const sortedStockTable = data
		.slice()
		.sort((a, b) => a.stockName.localeCompare(b.stockName));

	return (
		<TableContainer component={Paper}>
			<Table aria-label="collapsible table">
				<TableHead>
					<TableRow>
						<TableCell />
						<TableCell>Stock Name</TableCell>
						<TableCell>Quantity</TableCell>
						<TableCell>Avg. Cost</TableCell>
						<TableCell>Total Cost</TableCell>
						<TableCell>LTP</TableCell>
						<TableCell>Curr. Val</TableCell>
						<TableCell>P&L</TableCell>
						<TableCell>Net Change</TableCell>
						<TableCell>Day Change</TableCell>
						<TableCell></TableCell>
						<TableCell></TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{sortedStockTable.map((row) => (
						<Row
							key={row._id}
							row={row}
							historyRow={historyRow.filter(
								(history) => history.stockId === row._id
							)}
							onAdd={onAdd}
							onSell={onSell}
						/>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

CollapsibleTable.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			_id: PropTypes.string.isRequired,
			stockName: PropTypes.string.isRequired,
			quantity: PropTypes.number.isRequired,
			avgPrice: PropTypes.number.isRequired,
			totalCostOfStock: PropTypes.number.isRequired,
			ltp: PropTypes.number.isRequired,
			currVal: PropTypes.number.isRequired,
			pnl: PropTypes.number.isRequired,
			netChange: PropTypes.number.isRequired,
			dayChange: PropTypes.number.isRequired,
		})
	).isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	historyRow: PropTypes.arrayOf(
		PropTypes.shape({
			_id: PropTypes.string.isRequired,
			date: PropTypes.string.isRequired,
			quantity: PropTypes.number.isRequired,
			avgPrice: PropTypes.number.isRequired,
			age: PropTypes.number.isRequired,
			currPnl: PropTypes.number.isRequired,
			dateSold: PropTypes.string,
			quantitySold: PropTypes.number,
			sellingPrice: PropTypes.number,
			pnl: PropTypes.number.isRequired,
		})
	).isRequired,
};

export default CollapsibleTable;
