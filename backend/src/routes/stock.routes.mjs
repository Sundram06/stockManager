import { Router } from "express";
import { authenticateJWT } from "../middlewares/authenticate-jwt.mjs";
import { asyncHandler } from "../utils/async-handler.mjs";
import {
	createStock,
	listStocks,
	removeAllStocks,
	removeStock,
} from "../controllers/stock.controller.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import { createStockSchema } from "../validators/stock.schema.mjs";

const router = Router();

router.post("/stocks", authenticateJWT, validateRequest(createStockSchema), asyncHandler(createStock));
router.get("/stocks", authenticateJWT, asyncHandler(listStocks));
router.delete("/stocks", authenticateJWT, asyncHandler(removeAllStocks));
router.delete("/stocks/:id", authenticateJWT, asyncHandler(removeStock));

export default router;
