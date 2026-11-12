import { Router } from "express";
import cookieParser from "cookie-parser";
import passport from "passport";
import { asyncHandler } from "../utils/async-handler.mjs";
import { logError } from "../utils/logger.mjs";
import { validateRequest } from "../middlewares/validate-request.mjs";
import { rateLimit } from "../middlewares/rate-limit.mjs";
import {
	forgotPasswordSchema,
	googleCodeSchema,
	loginSchema,
	registerSchema,
	resendVerificationSchema,
	resetPasswordSchema,
	verifyEmailSchema,
} from "../validators/auth.schema.mjs";
import {
	exchangeGoogleCode,
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

// Login counts only failures per account, so a user who types the password
// right is never locked out by their own sign-ins. Emails cost real sends from
// the Gmail account, so those routes are the tightest.
const limits = {
	loginPerIp: rateLimit({ windowMinutes: 15, limit: 50 }),
	loginPerAccount: rateLimit({ windowMinutes: 15, limit: 10, by: "email", countFailuresOnly: true }),
	register: rateLimit({ windowMinutes: 60, limit: 10 }),
	emailPerIp: rateLimit({ windowMinutes: 60, limit: 10 }),
	emailPerAccount: rateLimit({ windowMinutes: 60, limit: 3, by: "email" }),
	tokenCheck: rateLimit({ windowMinutes: 15, limit: 30 }),
};

router.post("/register", limits.register, validateRequest(registerSchema), asyncHandler(register));
router.post(
	"/login",
	limits.loginPerIp,
	limits.loginPerAccount,
	validateRequest(loginSchema),
	asyncHandler(login),
);
router.post("/logout", authenticateJWT, asyncHandler(logout));
router.get("/api/me", authenticateJWT, asyncHandler(me));
router.post(
	"/api/forgot-password",
	limits.emailPerIp,
	limits.emailPerAccount,
	validateRequest(forgotPasswordSchema),
	asyncHandler(forgotPasswordHandler),
);
router.post(
	"/api/reset-password",
	limits.tokenCheck,
	validateRequest(resetPasswordSchema),
	asyncHandler(resetPasswordHandler),
);
router.post(
	"/api/verify-email",
	limits.tokenCheck,
	validateRequest(verifyEmailSchema),
	asyncHandler(verifyEmailHandler),
);
router.post(
	"/api/resend-verification",
	limits.emailPerIp,
	limits.emailPerAccount,
	validateRequest(resendVerificationSchema),
	asyncHandler(resendVerificationHandler),
);
router.post(
	"/api/auth/google/exchange",
	limits.tokenCheck,
	validateRequest(googleCodeSchema),
	asyncHandler(exchangeGoogleCode),
);

if (googleAuthEnabled) {
	router.get(
		"/api/auth/google",
		passport.authenticate("google", { scope: ["profile", "email"], session: false }),
	);
	router.get(
		"/api/auth/google/callback",
		cookieParser(),
		passport.authenticate("google", {
			failureRedirect: `${env.FE_URL}/login?error=google`,
			session: false,
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
