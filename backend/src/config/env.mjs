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

export const env = {
	NODE_ENV: nodeEnv,
	PORT: toNumber(process.env.PORT, 3000),
	DB_URI: process.env.DB_URI || "",
	FE_URL: process.env.FE_URL || "http://localhost:5173",
	JWT_SECRET: process.env.JWT_SECRET || "",
	SESSION_SECRET: process.env.SESSION_SECRET || "dev-session-secret",
	UPSTOX_API_KEY: process.env.UPSTOX_API_KEY || "",
	UPSTOX_API_SECRET: process.env.UPSTOX_API_SECRET || "",
	UPSTOX_REDIRECT_URI: process.env.UPSTOX_REDIRECT_URI || "",
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
	GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || "",
};

export const isProduction = env.NODE_ENV === "production";
