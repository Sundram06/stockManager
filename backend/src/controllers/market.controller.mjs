import { env } from "../config/env.mjs";
import { listInstruments } from "../services/instrument.service.mjs";
import {
	exchangeUpstoxToken,
	getUpstoxLoginUrl,
} from "../providers/upstox.provider.mjs";

export const getInstruments = async (req, res) => {
	const instruments = await listInstruments();
	return res.json(instruments);
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
