/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import useMarketData from "../hooks/useMarketData";

// Live prices arrive on one WebSocket, so there can only be one connection —
// which is why `ltpMap` used to be threaded through five layers of props. The
// provider opens that single connection; anything under it reads prices
// directly with useMarketPrices().

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
 * Outside a MarketDataProvider this returns an empty map rather than throwing,
 * so a component can render without live prices (tests, the import preview).
 */
export const useMarketPrices = () => useContext(MarketDataContext);
