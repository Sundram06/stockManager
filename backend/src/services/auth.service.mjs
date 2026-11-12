import bcrypt from "bcrypt";
import { env } from "../config/env.mjs";
import { User } from "../models/index.mjs";
import { randomToken, sha256 } from "../utils/crypto.mjs";
import { sendGoogleAccountNotice, sendPasswordResetEmail, sendVerificationEmail } from "../utils/email.mjs";
import { issueAuthToken } from "./auth-token.service.mjs";
import { redeemLoginCode } from "./login-code.service.mjs";

// One answer for an unknown email, a Google-only account and a wrong password,
// so the login form cannot be used to find out which emails are registered.
const INVALID_CREDENTIALS = {
	error: "Incorrect email or password. If you signed up with Google, use Continue with Google.",
	statusCode: 401,
	code: "INVALID_CREDENTIALS",
};

// Compared against when there is no password hash, so a missing account takes
// as long to reject as a wrong password.
const UNMATCHABLE_HASH = "$2b$10$6A0pNjisUHdZh1lNN.wttee8dBVh.rL5V.AJmPmUvYfnZS0epu7Si";

const NEUTRAL_RESET_MESSAGE = "If an account with that email exists, we have sent instructions to it.";

export const registerUser = async ({ name, email, password }) => {
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return { error: "Email already exists", statusCode: 400 };
	}

	const rawToken = randomToken();
	const hashed = sha256(rawToken);

	const newUser = new User({
		name,
		email,
		password,
		isEmailVerified: false,
		emailVerificationToken: hashed,
		emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
	});
	await newUser.save();

	const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
	await sendVerificationEmail({ to: email, verifyUrl });

	return {
		message: "Registration successful. Please check your email to verify your account.",
	};
};

export const loginUser = async ({ email, password }) => {
	const user = await User.findOne({ email });
	const passwordHash = user?.provider === "local" ? user.password : null;
	const isPasswordValid = await bcrypt.compare(password, passwordHash || UNMATCHABLE_HASH);
	if (!passwordHash || !isPasswordValid) return INVALID_CREDENTIALS;

	// Checked only after the password matches, so it reveals nothing to a guesser.
	// isEmailVerified === false means explicitly unverified (new users). undefined = legacy user, treated as verified.
	if (user.isEmailVerified === false) {
		return {
			error: "Please verify your email before logging in. Check your inbox or request a new link.",
			statusCode: 403,
			code: "EMAIL_NOT_VERIFIED",
		};
	}

	return { user, token: issueAuthToken(user) };
};

/** Completes a Google sign-in: trades the one-time code from the redirect for a session. */
export const signInWithLoginCode = async (code) => {
	const userId = await redeemLoginCode(code);
	const user = userId ? await User.findById(userId) : null;
	if (!user) {
		return {
			error: "This sign-in link has expired or was already used. Sign in again.",
			statusCode: 400,
			code: "INVALID_LOGIN_CODE",
		};
	}
	return { user, token: issueAuthToken(user) };
};

export const getUserProfile = async (userId) => {
	return User.findById(userId);
};

export const forgotPassword = async (email) => {
	const user = await User.findOne({ email });

	if (!user) return { message: NEUTRAL_RESET_MESSAGE };

	if (user.provider !== "local") {
		await sendGoogleAccountNotice({ to: email, loginUrl: `${env.APP_URL}/login` });
		return { message: NEUTRAL_RESET_MESSAGE };
	}

	const rawToken = randomToken();
	const hashed = sha256(rawToken);

	user.resetPasswordToken = hashed;
	user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
	await user.save();

	const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

	await sendPasswordResetEmail({ to: email, resetUrl });

	return { message: NEUTRAL_RESET_MESSAGE };
};

export const verifyEmail = async ({ email, token }) => {
	const hashed = sha256(token);

	const user = await User.findOne({
		email,
		emailVerificationToken: hashed,
		emailVerificationExpires: { $gt: new Date() },
	});

	if (!user) {
		return { error: "Invalid or expired verification link.", statusCode: 400, code: "INVALID_TOKEN" };
	}

	user.isEmailVerified = true;
	user.emailVerificationToken = undefined;
	user.emailVerificationExpires = undefined;
	await user.save();

	return { message: "Email verified successfully. You can now log in." };
};

export const resendVerification = async (email) => {
	const user = await User.findOne({ email });

	// Always return same message to prevent enumeration
	if (!user || user.provider !== "local" || user.isEmailVerified === true) {
		return { message: "If your account exists and is unverified, a new link has been sent." };
	}

	// Rate limit: don't resend if a fresh token (>23h remaining) already exists
	const remainingMs = user.emailVerificationExpires - Date.now();
	if (remainingMs > 23 * 60 * 60 * 1000) {
		return {
			error: "A verification email was sent recently. Please wait a few minutes before requesting another.",
			statusCode: 429,
		};
	}

	const rawToken = randomToken();
	const hashed = sha256(rawToken);

	user.emailVerificationToken = hashed;
	user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
	await user.save();

	const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
	await sendVerificationEmail({ to: email, verifyUrl });

	return { message: "If your account exists and is unverified, a new link has been sent." };
};

export const resetPassword = async ({ email, token, newPassword }) => {
	const hashed = sha256(token);

	const user = await User.findOne({
		email,
		resetPasswordToken: hashed,
		resetPasswordExpires: { $gt: new Date() },
	});

	if (!user) {
		return { error: "Invalid or expired reset token.", statusCode: 400 };
	}

	user.password = newPassword; // pre-save hook hashes it
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	// Whoever knew the old password may hold a session; end every one of them.
	user.tokenVersion = (user.tokenVersion ?? 0) + 1;
	await user.save();

	return { message: "Password reset successfully. You can now log in." };
};
