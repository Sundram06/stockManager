import { z } from "zod";

const emailField = z.string().trim().email("Enter a valid email address");

export const registerSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	email: emailField,
	password: z.string().trim().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
	email: emailField,
	password: z.string().trim().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
	email: emailField,
});

export const resetPasswordSchema = z.object({
	email: emailField,
	token: z.string().trim().min(1, "Token is required"),
	newPassword: z.string().trim().min(6, "Password must be at least 6 characters"),
});

export const verifyEmailSchema = z.object({
	email: emailField,
	token: z.string().trim().min(1, "Token is required"),
});

export const resendVerificationSchema = z.object({
	email: emailField,
});
