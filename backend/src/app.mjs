import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import { env } from "./config/env.mjs";
import { configureGooglePassport } from "./providers/google-oauth.provider.mjs";
import authRoutes from "./routes/auth.routes.mjs";
import stockRoutes from "./routes/stock.routes.mjs";
import historyRoutes from "./routes/history.routes.mjs";
import marketRoutes from "./routes/market.routes.mjs";
import transferRoutes from "./routes/transfer.routes.mjs";
import systemRoutes from "./routes/system.routes.mjs";
import { errorHandler } from "./middlewares/error-handler.mjs";
import { notFound } from "./middlewares/not-found.mjs";
import { requestId } from "./middlewares/request-id.mjs";
import { jsonBody } from "./middlewares/json-body.mjs";

export const createApp = () => {
	const app = express();
	// Without this, behind a proxy every request appears to come from the proxy,
	// and per-IP rate limits would be shared by all users.
	app.set("trust proxy", env.TRUST_PROXY);

	app.use(requestId);
	app.use(helmet());

	app.use(
		cors({
			origin: env.FE_URL,
			credentials: true,
			// Lets the browser read export file names.
			exposedHeaders: ["Content-Disposition"],
		}),
	);
	app.use(jsonBody);

	configureGooglePassport(passport);
	app.use(passport.initialize());

	app.use(systemRoutes);
	app.use(authRoutes);
	app.use(stockRoutes);
	app.use(historyRoutes);
	app.use(marketRoutes);
	app.use(transferRoutes);

	app.use(notFound);
	app.use(errorHandler);

	return app;
};
