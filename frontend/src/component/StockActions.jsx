/* eslint-disable react/prop-types */
import { Box, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BarChartIcon from "@mui/icons-material/BarChart";
import TimelineIcon from "@mui/icons-material/Timeline";

export default function StockActions({
	onAdd,
	onSell,
	onViewHistory,
	onChart,
	onDelete,
	canSell,
}) {
	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 0.25, justifyContent: "center" }}>
			<Tooltip title="Add lot">
				<IconButton
					size="small"
					onClick={onAdd}
					sx={{
						color: "text.secondary",
						"&:hover": { color: "primary.main", bgcolor: "primary.main" + "1a" },
					}}
				>
					<AddIcon sx={{ fontSize: "1rem" }} />
				</IconButton>
			</Tooltip>
			<Tooltip title={canSell ? "Sell" : "No shares to sell"}>
				<span>
					<IconButton
						size="small"
						onClick={canSell ? onSell : undefined}
						disabled={!canSell}
						sx={{
							color: canSell ? "text.secondary" : "text.disabled",
							"&:hover": { color: "warning.main", bgcolor: "warning.main" + "1a" },
						}}
					>
						<RemoveIcon sx={{ fontSize: "1rem" }} />
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title="Chart">
				<IconButton
					size="small"
					onClick={onChart}
					sx={{
						color: "text.secondary",
						"&:hover": { color: "primary.main", bgcolor: "primary.main" + "1a" },
					}}
				>
					<TimelineIcon sx={{ fontSize: "1rem" }} />
				</IconButton>
			</Tooltip>
			<Tooltip title="History">
				<IconButton
					size="small"
					onClick={onViewHistory}
					sx={{
						color: "text.secondary",
						"&:hover": { color: "info.main", bgcolor: "info.main" + "1a" },
					}}
				>
					<BarChartIcon sx={{ fontSize: "1rem" }} />
				</IconButton>
			</Tooltip>
			<Tooltip title="Delete stock">
				<IconButton
					size="small"
					onClick={onDelete}
					sx={{
						color: "error.main",
						"&:hover": { bgcolor: "error.main" + "1a" },
					}}
				>
					<DeleteIcon sx={{ fontSize: "1rem" }} />
				</IconButton>
			</Tooltip>
		</Box>
	);
}
