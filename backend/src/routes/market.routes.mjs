import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.mjs";
import { authenticateJWT } from "../middlewares/authenticate-jwt.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import { instrumentSearchQuerySchema, priceHistoryQuerySchema } from "../validators/market.schema.mjs";
import { getInstrumentSearch, getPriceHistory } from "../controllers/market.controller.mjs";

const router = Router();

router.get(
	"/api/instruments/search",
	authenticateJWT,
	validateRequest(instrumentSearchQuerySchema, (req) => req.query),
	asyncHandler(getInstrumentSearch),
);
router.get(
	"/api/market/history/:instrument",
	authenticateJWT,
	validateRequest(priceHistoryQuerySchema, (req) => req.query),
	asyncHandler(getPriceHistory),
);

export default router;
