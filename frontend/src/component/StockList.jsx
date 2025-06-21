import PropTypes from "prop-types";
import { Typography, Grid } from "@mui/material";
import StockCard from "./StockCard";

export default function StockList({
	title,
	stocks,
	onAdd,
	onSell,
	onViewHistory,
	onDelete,
	isDormant,
}) {
	return (
		<>
			<Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
				{title}
			</Typography>
			<Grid container spacing={3} justifyContent="center">
				{stocks.map((stock) => (
					<Grid item key={stock._id}>
						<StockCard
							stock={stock}
							onAdd={onAdd}
							onSell={onSell}
							onViewHistory={onViewHistory}
							onDelete={onDelete}
							isDormant={isDormant}
						/>
					</Grid>
				))}
			</Grid>
		</>
	);
}

StockList.propTypes = {
	title: PropTypes.string.isRequired,
	stocks: PropTypes.array.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
	isDormant: PropTypes.bool,
};
