import dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV || "development";

// Keep current env file convention to avoid deployment surprises.
dotenv.config({
	path: nodeEnv === "production" ? ".env.production" : ".env.development",
});

const toNumber = (value, fallback) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

// Express "trust proxy": unset means false, a number is the count of proxies
// in front of the app, and anything else is passed through (e.g. "loopback").
const toTrustProxy = (value) => {
	if (value === undefined || value === "" || value === "false") return false;
	if (value === "true") return true;
	const hops = Number(value);
	return Number.isInteger(hops) ? hops : value;
};

export const env = {
	NODE_ENV: nodeEnv,
	PORT: toNumber(process.env.PORT, 3000),
	DB_URI: process.env.DB_URI || "",
	FE_URL: process.env.FE_URL || "http://localhost:5173",
	JWT_SECRET: process.env.JWT_SECRET || "",
	TRUST_PROXY: toTrustProxy(process.env.TRUST_PROXY),
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
	GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "",
	UPSTOX_ANALYTICS_TOKEN: process.env.UPSTOX_ANALYTICS_TOKEN || "",
	GMAIL_USER: process.env.GMAIL_USER || "",
	GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
	APP_URL: process.env.APP_URL || "http://localhost:5173",
};

export const isProduction = env.NODE_ENV === "production";
