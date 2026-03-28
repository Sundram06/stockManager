import fetch from "node-fetch";
import { env } from "../config/env.mjs";

export const getUpstoxLoginUrl = () => {
	return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${env.UPSTOX_API_KEY}&redirect_uri=${env.UPSTOX_REDIRECT_URI}`;
};

export const exchangeUpstoxToken = async (authorizationCode) => {
	const url = "https://api.upstox.com/v2/login/authorization/token";
	const headers = {
		accept: "application/json",
		"Content-Type": "application/x-www-form-urlencoded",
	};

	const body = new URLSearchParams();
	body.append("code", authorizationCode);
	body.append("client_id", env.UPSTOX_API_KEY);
	body.append("client_secret", env.UPSTOX_API_SECRET);
	body.append("redirect_uri", env.UPSTOX_REDIRECT_URI);
	body.append("grant_type", "authorization_code");

	const response = await fetch(url, {
		method: "POST",
		headers,
		body: body.toString(),
	});

	return response.json();
};
