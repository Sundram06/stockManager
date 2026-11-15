import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { historyQuery, stocksQuery } from "../util/api/portfolioQueries.mjs";
import {
	groupHistoryByStockId,
	computeActiveStockMetrics,
} from "../util/portfolioMetrics.mjs";

export default function usePortfolioData({ activeTab, search }) {
	const {
		data: stocks = [],
		isLoading,
		error,
	} = useQuery(stocksQuery);

	const { data: historyRows = [] } = useQuery(historyQuery);

	const historyByStockId = useMemo(
		() => groupHistoryByStockId(historyRows),
		[historyRows],
	);

	const activeStockMetrics = useMemo(
		() => computeActiveStockMetrics(stocks, historyByStockId),
		[stocks, historyByStockId],
	);

	const sortedStocks = useMemo(() => {
		return stocks
			.slice()
			.sort((a, b) => (a.stockName || "").localeCompare(b.stockName || ""));
	}, [stocks]);

	const normalizedSearch = useMemo(
		() => (search || "").toLowerCase(),
		[search],
	);

	const filteredStocks = useMemo(() => {
		return sortedStocks.filter(
			(stock) =>
				(activeTab === 0 ? stock.quantity > 0 : stock.quantity <= 0) &&
				(!normalizedSearch ||
					stock.stockName.toLowerCase().includes(normalizedSearch)),
		);
	}, [sortedStocks, activeTab, normalizedSearch]);

	return {
		stocks,
		historyByStockId,
		activeStockMetrics,
		filteredStocks,
		isLoading,
		error,
	};
}
