import { useMediaQuery, useTheme } from "@mui/material";
import PropTypes from "prop-types";
import StockTable from "./StockTable";

export default function PortfolioViewSwitch(props) {
	const theme = useTheme();
	const isMobileOrTablet = useMediaQuery(theme.breakpoints.down("md"));

	// Keep both paths behavior-identical for now; Phase 3 only splits render routes.
	if (isMobileOrTablet) {
		return <StockTable {...props} />;
	}

	return <StockTable {...props} />;
}

PortfolioViewSwitch.propTypes = {
	stocks: PropTypes.arrayOf(PropTypes.object).isRequired,
	activeTab: PropTypes.number.isRequired,
	historyByStockId: PropTypes.object.isRequired,
	activeStockMetrics: PropTypes.object.isRequired,
	onAdd: PropTypes.func.isRequired,
	onSell: PropTypes.func.isRequired,
	onViewHistory: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};
