import { env } from "../config/env.mjs";
import { searchInstruments } from "../services/instrument.service.mjs";
import { fetchPriceHistory } from "../services/market-history.service.mjs";
import { subscriptionService } from "../services/subscription.service.mjs";
import { AppError } from "../errors/app-error.mjs";
import {
	exchangeUpstoxToken,
	getUpstoxLoginUrl,
} from "../providers/upstox.provider.mjs";

export const getInstrumentSearch = async (req, res) => {
	const q = req.query.q?.trim();
	if (!q || q.length < 2) {
		throw new AppError("Query param 'q' must be at least 2 characters", 400);
	}
	const results = await searchInstruments(q);
	return res.json(results);
};

/**
 * GET /api/market/history/:instrument?range=1Y
 * `:instrument` is either an instrument key ("NSE_EQ|INE009A01021", URL-encoded)
 * or a bare trading symbol ("INFY") for stocks that pre-date Phase 1.
 */
export const getPriceHistory = async (req, res) => {
	const raw = decodeURIComponent(req.params.instrument ?? "").trim();
	if (!raw) throw new AppError("Instrument is required", 400);

	const instrumentKey = raw.includes("|") ? raw : subscriptionService.keyForSymbol(raw);
	if (!instrumentKey) {
		throw new AppError(`No instrument key found for '${raw}'`, 404);
	}

	const data = await fetchPriceHistory(instrumentKey, req.validated.range);
	return res.json({ instrumentKey, range: req.validated.range, candles: data });
};

export const getUpstoxLogin = async (req, res) => {
	return res.json(getUpstoxLoginUrl());
};

export const upstoxCallback = async (req, res) => {
	const authorizationCode = req.query.code;
	const tokenResponse = await exchangeUpstoxToken(authorizationCode);
	process.env.access_token = tokenResponse.access_token;
	return res.redirect(`${env.FE_URL}/`);
};
