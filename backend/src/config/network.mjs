import http from "node:http";
import https from "node:https";
import { isProduction } from "./env.mjs";

// Some networks hand out only AAAA (IPv6) records for Google's endpoints while
// having no working IPv6 route. Node then dials the IPv6 address and hangs, so
// the Google OAuth token exchange fails with a connect timeout and sign-in
// returns a 500.
//
// Outbound requests prefer IPv4 in development for that reason. Set
// PREFER_IPV4=false to turn it off, or true to force it in production too.
export const preferIPv4 = () => {
	const flag = process.env.PREFER_IPV4;
	const on = flag === "true" || (flag !== "false" && !isProduction);
	if (!on) return false;

	http.globalAgent.options.family = 4;
	https.globalAgent.options.family = 4;
	return true;
};
