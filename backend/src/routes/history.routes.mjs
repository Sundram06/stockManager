import { Router } from "express";
import { authenticateJWT } from "../middlewares/authenticate-jwt.mjs";
import { asyncHandler } from "../utils/async-handler.mjs";
import {
	addHistory,
	getHistory,
	sellHistoryStock,
} from "../controllers/history.controller.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import {
	createHistorySchema,
	sellHistorySchema,
} from "../validators/history.schema.mjs";

const router = Router();

router.get("/history", authenticateJWT, asyncHandler(getHistory));
router.post("/history", authenticateJWT, validateRequest(createHistorySchema), asyncHandler(addHistory));
router.post(
	"/history/sell",
	authenticateJWT,
	validateRequest(sellHistorySchema),
	asyncHandler(sellHistoryStock),
);

export default router;
