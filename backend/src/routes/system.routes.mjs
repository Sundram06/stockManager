import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.mjs";
import { health, root } from "../controllers/system.controller.mjs";

const router = Router();

router.get("/", asyncHandler(root));
router.get("/healthz", asyncHandler(health));

export default router;
