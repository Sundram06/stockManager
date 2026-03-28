import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.mjs";
import {
	getInstrumentSearch,
	getUpstoxLogin,
	upstoxCallback,
} from "../controllers/market.controller.mjs";

const router = Router();

router.get("/api/instruments/search", asyncHandler(getInstrumentSearch));
router.get("/api/upstox/login", asyncHandler(getUpstoxLogin));
router.get("/api/upstocks/callback", asyncHandler(upstoxCallback));

export default router;
