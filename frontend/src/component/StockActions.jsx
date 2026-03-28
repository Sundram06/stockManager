/* eslint-disable react/prop-types */
import { IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BarChartIcon from "@mui/icons-material/BarChart";

/**
 * Shared stock action buttons used across desktop table rows, and
 * ready to be reused in future mobile/tablet action sheets.
 *
 * Props:
 *   onAdd         - handler called when Add is clicked
 *   onSell        - handler called when Sell is clicked
 *   onViewHistory - handler called when History is clicked
 *   onDelete      - handler called when Delete is clicked
 *   canSell       - whether the Sell button is enabled
 */
export default function StockActions({
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
	canSell,
}) {
	return (
		<>
			<IconButton color="primary" onClick={onAdd} title="Add">
				<AddIcon />
			</IconButton>
			<IconButton
				color="warning"
				onClick={canSell ? onSell : undefined}
				title="Sell"
				disabled={!canSell}
				sx={{ ml: 0.5, ...(!canSell && { opacity: 0.7 }) }}
			>
				<RemoveIcon />
			</IconButton>
			<IconButton
				color="info"
				onClick={onViewHistory}
				title="History"
				sx={{ ml: 0.5 }}
			>
				<BarChartIcon />
			</IconButton>
			<IconButton
				color="error"
				onClick={onDelete}
				title="Delete"
				sx={{ ml: 0.5 }}
			>
				<DeleteIcon />
			</IconButton>
		</>
	);
}
