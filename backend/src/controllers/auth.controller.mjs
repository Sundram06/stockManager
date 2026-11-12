import { env } from "../config/env.mjs";
import {
	forgotPassword,
	getUserProfile,
	loginUser,
	registerUser,
	resendVerification,
	resetPassword,
	signInWithLoginCode,
	verifyEmail,
} from "../services/auth.service.mjs";
import { revokeAuthTokens } from "../services/auth-token.service.mjs";
import { createLoginCode } from "../services/login-code.service.mjs";

export const register = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await registerUser(payload);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error });
	}
	return res.status(201).json({ message: result.message });
};

export const login = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await loginUser(payload);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error, code: result.code });
	}
	return res.json({ user: result.user, token: result.token });
};

// Ends every session of this user, not only the caller's: a token carries no
// per-device id, so revocation works per account.
export const logout = async (req, res) => {
	await revokeAuthTokens(req.userId);
	return res.json({ message: "Logout successful" });
};

export const me = async (req, res) => {
	const user = await getUserProfile(req.userId);
	if (!user) {
		return res.status(404).json({ message: "User not found" });
	}
	return res.json(user);
};

export const forgotPasswordHandler = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await forgotPassword(payload.email);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error });
	}
	return res.json(result);
};

export const verifyEmailHandler = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await verifyEmail(payload);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error, code: result.code });
	}
	return res.json(result);
};

export const resendVerificationHandler = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await resendVerification(payload.email);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error });
	}
	return res.json(result);
};

export const resetPasswordHandler = async (req, res) => {
	const payload = req.validated || req.body;
	const result = await resetPassword(payload);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error });
	}
	return res.json(result);
};

// The redirect carries a one-minute, single-use code rather than the session
// token, and in the fragment: browsers never send a fragment to a server, so
// it stays out of access logs and Referer headers.
export const googleOAuthCallback = async (req, res) => {
	const code = await createLoginCode(req.user._id);
	return res.redirect(`${env.FE_URL}/oauth-success#code=${code}`);
};

export const exchangeGoogleCode = async (req, res) => {
	const result = await signInWithLoginCode(req.validated.code);
	if (result.error) {
		return res.status(result.statusCode).json({ message: result.error, code: result.code });
	}
	return res.json({ user: result.user, token: result.token });
};
