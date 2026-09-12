import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.mjs";
import { authenticateJWT } from "../middlewares/authenticate-jwt.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import { priceHistoryQuerySchema } from "../validators/market.schema.mjs";
import {
	getInstrumentSearch,
	getPriceHistory,
	getUpstoxLogin,
	upstoxCallback,
} from "../controllers/market.controller.mjs";

const router = Router();

router.get("/api/instruments/search", asyncHandler(getInstrumentSearch));
router.get(
	"/api/market/history/:instrument",
	authenticateJWT,
	validateRequest(priceHistoryQuerySchema, (req) => req.query),
	asyncHandler(getPriceHistory),
);
router.get("/api/upstox/login", asyncHandler(getUpstoxLogin));
router.get("/api/upstocks/callback", asyncHandler(upstoxCallback));

export default router;
