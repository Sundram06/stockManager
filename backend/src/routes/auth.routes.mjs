import { Router } from "express";
import passport from "passport";
import { asyncHandler } from "../utils/async-handler.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
} from "../validators/auth.schema.mjs";
import {
	forgotPasswordHandler,
	googleOAuthCallback,
	login,
	logout,
	me,
	register,
} from "../controllers/auth.controller.mjs";
import { authenticateJWT } from "../middlewares/authenticate-jwt.mjs";
import { env } from "../config/env.mjs";

const router = Router();
const googleAuthEnabled = Boolean(
	env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REDIRECT_URI,
);

router.post("/register", validateRequest(registerSchema), asyncHandler(register));
router.post("/login", validateRequest(loginSchema), asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/api/me", authenticateJWT, asyncHandler(me));
router.post(
	"/api/forgot-password",
	validateRequest(forgotPasswordSchema),
	asyncHandler(forgotPasswordHandler),
);

if (googleAuthEnabled) {
	router.get(
		"/api/auth/google",
		passport.authenticate("google", { scope: ["profile", "email"] }),
	);
	router.get(
		"/api/auth/google/callback",
		passport.authenticate("google", {
			failureRedirect: `${env.FE_URL}/login`,
			session: true,
		}),
		asyncHandler(googleOAuthCallback),
	);
} else {
	router.get("/api/auth/google", (req, res) => {
		res.status(503).json({ message: "Google OAuth is not configured" });
	});
	router.get("/api/auth/google/callback", (req, res) => {
		res.status(503).json({ message: "Google OAuth is not configured" });
	});
}

export default router;
