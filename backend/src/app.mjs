import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { env, isProduction } from "./config/env.mjs";
import { configureGooglePassport } from "./providers/google-oauth.provider.mjs";
import authRoutes from "./routes/auth.routes.mjs";
import stockRoutes from "./routes/stock.routes.mjs";
import historyRoutes from "./routes/history.routes.mjs";
import marketRoutes from "./routes/market.routes.mjs";
import systemRoutes from "./routes/system.routes.mjs";
import { errorHandler } from "./middlewares/error-handler.mjs";
import { notFound } from "./middlewares/not-found.mjs";
import { requestId } from "./middlewares/request-id.mjs";

export const createApp = () => {
	const app = express();
	app.use(requestId);

	app.use(
		cors({
			origin: env.FE_URL,
			credentials: true,
		}),
	);
	app.use(express.json());
	app.use(
		session({
			secret: env.SESSION_SECRET,
			resave: false,
			saveUninitialized: true,
			cookie: {
				secure: isProduction,
				sameSite: isProduction ? "none" : "lax",
			},
		}),
	);

	configureGooglePassport(passport);
	app.use(passport.initialize());
	app.use(passport.session());

	app.use(systemRoutes);
	app.use(authRoutes);
	app.use(stockRoutes);
	app.use(historyRoutes);
	app.use(marketRoutes);

	app.use(notFound);
	app.use(errorHandler);

	return app;
};
