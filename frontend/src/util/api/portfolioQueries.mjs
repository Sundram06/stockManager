import { fetchStocks } from "./stocks.mjs";
import { fetchStockHistoryById } from "./history.mjs";

// One definition per dashboard query, shared by the components that read them
// and by the prefetch at sign-in, so a prefetched result is reused rather than
// fetched again.
const shared = {
	staleTime: 60 * 1000,
	gcTime: 5 * 60 * 1000,
	refetchOnWindowFocus: false,
};

export const stocksQuery = { queryKey: ["stocks"], queryFn: fetchStocks, ...shared };
export const historyQuery = { queryKey: ["history"], queryFn: fetchStockHistoryById, ...shared };
