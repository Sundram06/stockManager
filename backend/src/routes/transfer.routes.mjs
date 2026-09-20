import { Router } from "express";
import { authenticateJWT } from "../middlewares/authenticate-jwt.mjs";
import { asyncHandler } from "../utils/async-handler.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import {
	exportHoldingsCsv,
	exportJson,
	exportTransactionsCsv,
	importCommit,
	importList,
	importPreview,
	importUndo,
} from "../controllers/transfer.controller.mjs";
import { importCommitSchema, importPreviewSchema } from "../validators/transfer.schema.mjs";

const router = Router();

router.get("/api/export/json", authenticateJWT, asyncHandler(exportJson));
router.get("/api/export/holdings.csv", authenticateJWT, asyncHandler(exportHoldingsCsv));
router.get("/api/export/transactions.csv", authenticateJWT, asyncHandler(exportTransactionsCsv));

router.post("/api/import/preview", authenticateJWT, validateRequest(importPreviewSchema), asyncHandler(importPreview));
router.post("/api/import/commit", authenticateJWT, validateRequest(importCommitSchema), asyncHandler(importCommit));
router.get("/api/import/batches", authenticateJWT, asyncHandler(importList));
router.post("/api/import/batches/:id/undo", authenticateJWT, asyncHandler(importUndo));

export default router;
