import { Router } from "express";
import passport from "passport";
import { asyncHandler } from "../utils/async-handler.mjs";
import { logError } from "../utils/logger.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import {
	forgotPasswordSchema,
	loginSchema,
	registerSchema,
	resendVerificationSchema,
	resetPasswordSchema,
	verifyEmailSchema,
} from "../validators/auth.schema.mjs";
import {
	forgotPasswordHandler,
	googleOAuthCallback,
	login,
	logout,
	me,
	register,
	resendVerificationHandler,
	resetPasswordHandler,
	verifyEmailHandler,
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
router.post(
	"/api/reset-password",
	validateRequest(resetPasswordSchema),
	asyncHandler(resetPasswordHandler),
);
router.post(
	"/api/verify-email",
	validateRequest(verifyEmailSchema),
	asyncHandler(verifyEmailHandler),
);
router.post(
	"/api/resend-verification",
	validateRequest(resendVerificationSchema),
	asyncHandler(resendVerificationHandler),
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
		// failureRedirect covers a declined sign-in, not a thrown one: if the
		// token exchange with Google fails (network, clock, revoked secret) the
		// user would otherwise see a raw 500. Send them back to the login page
		// with something they can act on; the cause is in the server log.
		(err, req, res, next) => {
			if (res.headersSent) return next(err);
			logError("Google sign-in failed", {
				requestId: req.requestId,
				errorName: err?.name,
				errorMessage: err?.message,
				...(err?.code && { errorCode: err.code }),
			});
			return res.redirect(`${env.FE_URL}/login?error=google`);
		},
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
