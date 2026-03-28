import { env } from "../config/env.mjs";

export const getAnalyticsToken = () => {
	if (!env.UPSTOX_ANALYTICS_TOKEN) {
		throw new Error("UPSTOX_ANALYTICS_TOKEN is not configured");
	}
	return env.UPSTOX_ANALYTICS_TOKEN;
};
