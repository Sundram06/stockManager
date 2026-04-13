import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { AUTH_TOKEN_EXPIRY } from "../config/constants.mjs";
import { env } from "../config/env.mjs";
import { User } from "../models/index.mjs";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email.mjs";

export const registerUser = async ({ name, email, password }) => {
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return { error: "Email already exists", statusCode: 400 };
	}

	const rawToken = crypto.randomBytes(32).toString("hex");
	const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

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
	if (!user) {
		return { error: "No account found with this email.", statusCode: 401, code: "USER_NOT_FOUND" };
	}

	if (user.provider !== "local" || !user.password) {
		return {
			error: "This account uses Google sign-in. Use 'Forgot Password' to set a password if you want to log in with email.",
			statusCode: 401,
			code: "GOOGLE_ACCOUNT",
		};
	}

	// isEmailVerified === false means explicitly unverified (new users). undefined = legacy user, treated as verified.
	if (user.isEmailVerified === false) {
		return {
			error: "Please verify your email before logging in. Check your inbox or request a new link.",
			statusCode: 403,
			code: "EMAIL_NOT_VERIFIED",
		};
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		return { error: "Incorrect password.", statusCode: 401, code: "WRONG_PASSWORD" };
	}

	const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
		expiresIn: AUTH_TOKEN_EXPIRY,
	});
	return { user, token };
};

export const createUserToken = (userId) => {
	return jwt.sign({ userId }, env.JWT_SECRET, {
		expiresIn: AUTH_TOKEN_EXPIRY,
	});
};

export const getUserProfile = async (userId) => {
	return User.findById(userId).select("-password");
};

export const forgotPassword = async (email) => {
	const user = await User.findOne({ email });

	if (!user) {
		return {
			message: "If an account with that email exists, a reset link has been sent.",
		};
	}

	if (user.provider !== "local") {
		return {
			error: "This account uses Google sign-in. Please log in with Google.",
			statusCode: 400,
		};
	}

	const rawToken = crypto.randomBytes(32).toString("hex");
	const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

	user.resetPasswordToken = hashed;
	user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
	await user.save();

	const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

	await sendPasswordResetEmail({ to: email, resetUrl });

	return {
		message: "If an account with that email exists, a reset link has been sent.",
	};
};

export const verifyEmail = async ({ email, token }) => {
	const hashed = crypto.createHash("sha256").update(token).digest("hex");

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

	const rawToken = crypto.randomBytes(32).toString("hex");
	const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");

	user.emailVerificationToken = hashed;
	user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
	await user.save();

	const verifyUrl = `${env.APP_URL}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;
	await sendVerificationEmail({ to: email, verifyUrl });

	return { message: "If your account exists and is unverified, a new link has been sent." };
};

export const resetPassword = async ({ email, token, newPassword }) => {
	const hashed = crypto.createHash("sha256").update(token).digest("hex");

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
	await user.save();

	return { message: "Password reset successfully. You can now log in." };
};
