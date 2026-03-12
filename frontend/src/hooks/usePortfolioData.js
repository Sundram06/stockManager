import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStocks, fetchStockHistoryById } from "../util/http.mjs";
import {
	groupHistoryByStockId,
	computeActiveStockMetrics,
} from "../util/portfolioMetrics.mjs";

const QUERY_STALE_TIME = 60 * 1000;
const QUERY_GC_TIME = 5 * 60 * 1000;

export default function usePortfolioData({ activeTab, search }) {
	const {
		data: stocks = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["stocks"],
		queryFn: fetchStocks,
		staleTime: QUERY_STALE_TIME,
		gcTime: QUERY_GC_TIME,
		refetchOnWindowFocus: false,
	});

	const { data: historyRows = [] } = useQuery({
		queryKey: ["history"],
		queryFn: fetchStockHistoryById,
		staleTime: QUERY_STALE_TIME,
		gcTime: QUERY_GC_TIME,
		refetchOnWindowFocus: false,
	});

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
