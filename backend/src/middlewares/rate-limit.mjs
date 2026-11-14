import { ipKeyGenerator, rateLimit as expressRateLimit } from "express-rate-limit";
import { AppError } from "../errors/app-error.mjs";

const keyByIp = (req) => ipKeyGenerator(req.ip);

// Per account, so a guesser rotating IP addresses is still stopped. Requests
// without an email fall back to the IP. Must run after express.json().
const keyByEmail = (req) => {
	const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
	return email ? `email:${email}` : keyByIp(req);
};

/**
 * Builds a rate limiter for one route. Over the limit, the request fails with
 * 429 and code RATE_LIMITED through the normal error handler.
 *
 * Counts are in memory, per process. Behind a proxy, TRUST_PROXY must be set
 * or every visitor shares the proxy's address and its per-IP budget.
 *
 * @param {object} options
 * @param {number} options.windowMinutes
 * @param {number} options.limit                     requests allowed per window
 * @param {"ip"|"email"} [options.by="ip"]
 * @param {boolean} [options.countFailuresOnly=false] successful (2xx/3xx) requests are not counted
 */
export const rateLimit = ({ windowMinutes, limit, by = "ip", countFailuresOnly = false }) =>
	expressRateLimit({
		windowMs: windowMinutes * 60 * 1000,
		limit,
		keyGenerator: by === "email" ? keyByEmail : keyByIp,
		skipSuccessfulRequests: countFailuresOnly,
		standardHeaders: "draft-7",
		legacyHeaders: false,
		handler: (req, res, next) => {
			const resetAt = req.rateLimit?.resetTime?.getTime() ?? Date.now() + windowMinutes * 60 * 1000;
			const minutes = Math.max(1, Math.ceil((resetAt - Date.now()) / 60000));
			next(
				new AppError(`Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, 429, {
					code: "RATE_LIMITED",
				}),
			);
		},
	});
