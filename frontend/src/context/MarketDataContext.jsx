/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import useMarketData from "../hooks/useMarketData";

// Live prices arrive on one WebSocket, so the app must open exactly one
// connection. The provider owns it and everything below reads from context.

const MarketDataContext = createContext({ ltpMap: {}, isConnected: false });

export function MarketDataProvider({ children }) {
	const { ltpMap, isConnected } = useMarketData();
	const value = useMemo(() => ({ ltpMap, isConnected }), [ltpMap, isConnected]);

	return <MarketDataContext.Provider value={value}>{children}</MarketDataContext.Provider>;
}

MarketDataProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

/**
 * Live prices by trading symbol: `{ ltpMap: { INFY: { ltp, cp } }, isConnected }`.
 * Outside a provider this returns an empty map instead of throwing, so a
 * component still renders without live prices.
 */
export const useMarketPrices = () => useContext(MarketDataContext);
