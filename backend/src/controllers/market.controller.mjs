import { env } from "../config/env.mjs";
import { searchInstruments } from "../services/instrument.service.mjs";
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

export const getUpstoxLogin = async (req, res) => {
	return res.json(getUpstoxLoginUrl());
};

export const upstoxCallback = async (req, res) => {
	const authorizationCode = req.query.code;
	const tokenResponse = await exchangeUpstoxToken(authorizationCode);
	process.env.access_token = tokenResponse.access_token;
	return res.redirect(`${env.FE_URL}/`);
};
