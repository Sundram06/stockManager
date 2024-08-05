// Row.js

import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Button } from "@mui/material";
import HistoryTable from "./HistoryTable";

function Row(props) {
	const { row, historyRow, onAdd, onSell } = props;
	const [open, setOpen] = React.useState(false);

	return (
		<React.Fragment>
			<TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
				<TableCell>
					<IconButton
						aria-label="expand row"
						size="small"
						onClick={() => setOpen(!open)}
					>
						{open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
					</IconButton>
				</TableCell>
				<TableCell component="th" scope="row">
					{row.stockName}
				</TableCell>
				<TableCell>{row.quantity}</TableCell>
				<TableCell>{row.avgPrice}</TableCell>
				<TableCell>{row.totalCostOfStock}</TableCell>
				<TableCell>{row.ltp}</TableCell>
				<TableCell>{row.currVal}</TableCell>
				<TableCell>{row.pnl}</TableCell>
				<TableCell>{row.netChange}</TableCell>
				<TableCell>{row.dayChange}</TableCell>
				<TableCell align="right">
					<Button variant="contained" onClick={() => onAdd(row)}>
						Add
					</Button>
				</TableCell>
				<TableCell>
					<Button variant="contained" onClick={() => onSell(row._id)}>
						Sell
					</Button>
				</TableCell>
			</TableRow>
			<TableRow>
				<TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
					<Collapse in={open} timeout="auto" unmountOnExit>
						<Box sx={{ margin: 1 }}>
							<Typography variant="h6" gutterBottom component="div">
								History
							</Typography>
							<HistoryTable historyRow={historyRow} />{" "}
							{/* <-- Use the new HistoryTable component */}
						</Box>
					</Collapse>
				</TableCell>
			</TableRow>
		</React.Fragment>
	);
}

Row.propTypes = {
	row: PropTypes.shape({
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
	}).isRequired,
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

export default Row;
