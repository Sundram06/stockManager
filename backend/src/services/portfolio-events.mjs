import { EventEmitter } from "node:events";

const HOLDINGS_CHANGED = "holdings-changed";
const emitter = new EventEmitter();

/**
 * In-process notifications about a user's portfolio. The live-price socket
 * listens so it can start sending prices for a stock the moment the user
 * adds, imports or restores it.
 */
export const portfolioEvents = {
	holdingsChanged(userId) {
		emitter.emit(HOLDINGS_CHANGED, String(userId));
	},

	/** Returns a function that removes the listener. */
	onHoldingsChanged(listener) {
		emitter.on(HOLDINGS_CHANGED, listener);
		return () => emitter.off(HOLDINGS_CHANGED, listener);
	},
};
