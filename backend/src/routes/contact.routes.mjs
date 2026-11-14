import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import { rateLimit } from "../middlewares/rate-limit.mjs";
import { contactSchema } from "../validators/contact.schema.mjs";
import { contact } from "../controllers/contact.controller.mjs";

const router = Router();

// Each message is a real email from the Gmail account, so sending is tightly
// limited. Validation runs first so a form with typos does not use up the budget.
router.post(
	"/api/contact",
	validateRequest(contactSchema),
	rateLimit({ windowMinutes: 60, limit: 10 }),
	rateLimit({ windowMinutes: 60, limit: 3, by: "email" }),
	asyncHandler(contact),
);

export default router;
