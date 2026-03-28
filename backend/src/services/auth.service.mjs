import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AUTH_TOKEN_EXPIRY } from "../config/constants.mjs";
import { env } from "../config/env.mjs";
import { User } from "../models/index.mjs";

export const registerUser = async ({ name, email, password }) => {
	const existingUser = await User.findOne({ email });
	if (existingUser) {
		return { error: "Email already exists", statusCode: 400 };
	}

	const newUser = new User({ name, email, password });
	await newUser.save();

	return {
		user: { _id: newUser._id, name: newUser.name, email: newUser.email },
	};
};

export const loginUser = async ({ email, password }) => {
	const user = await User.findOne({ email });
	if (!user) {
		return { error: "Invalid credentials", statusCode: 401 };
	}

	const isPasswordValid = await bcrypt.compare(password, user.password);
	if (!isPasswordValid) {
		return { error: "Invalid credentials", statusCode: 401 };
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
	if (user) {
		console.log(`Password reset requested for: ${email}`);
	}

	return {
		message: "If an account with that email exists, a reset link has been sent.",
	};
};
