import { historyQuery, stocksQuery } from "./api/portfolioQueries.mjs";

/** Starts downloading the dashboard page's code. Safe to call any number of times. */
export const preloadDashboardCode = () => import("../pages/DashboardPage").catch(() => {});

/**
 * Called the moment a session token exists: fetches the dashboard's code and
 * data in parallel with the navigation, instead of one after the other.
 * Failures are ignored; the dashboard's own queries retry and report errors.
 */
export const preloadDashboard = (queryClient) => {
	preloadDashboardCode();
	queryClient.prefetchQuery(stocksQuery);
	queryClient.prefetchQuery(historyQuery);
};
