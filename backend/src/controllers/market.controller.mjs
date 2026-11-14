import { searchInstruments } from "../services/instrument.service.mjs";
import { fetchPriceHistory } from "../services/market-history.service.mjs";
import { subscriptionService } from "../services/subscription.service.mjs";
import { AppError } from "../errors/app-error.mjs";

export const getInstrumentSearch = async (req, res) => {
	const results = await searchInstruments(req.validated.q);
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
