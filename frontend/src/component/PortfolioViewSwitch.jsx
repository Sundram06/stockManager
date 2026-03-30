import PropTypes from "prop-types";
import StockTable from "./StockTable";
import PortfolioMobileList from "./PortfolioMobileList";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function PortfolioViewSwitch(props) {
  const isMobileOrTablet = useMediaQuery("(max-width: 899px)");

  if (isMobileOrTablet) {
    return <PortfolioMobileList {...props} />;
  }

  return <StockTable {...props} />;
}

PortfolioViewSwitch.propTypes = {
  stocks: PropTypes.arrayOf(PropTypes.object).isRequired,
  activeTab: PropTypes.number.isRequired,
  historyByStockId: PropTypes.object.isRequired,
  activeStockMetrics: PropTypes.object.isRequired,
  ltpMap: PropTypes.object.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onAdd: PropTypes.func.isRequired,
  onSell: PropTypes.func.isRequired,
  onViewHistory: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
