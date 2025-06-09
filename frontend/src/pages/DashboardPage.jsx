// import Portfolio from "../component/Portfolio";
import PortfolioCards from "../component/PortfolioCards";
import StockToolbar from "../component/StockToolbar";
// import MarketDataFeed from "../component/Testwebsocket";

export default function DashboardPage() {
	return (
		<>
			<StockToolbar />
			<PortfolioCards />
		</>
	);
}
