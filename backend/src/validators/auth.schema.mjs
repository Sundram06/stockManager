import { z } from "zod";

export const registerSchema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	email: z.string().trim().min(1, "Email is required"),
	password: z.string().trim().min(1, "Password is required"),
});

export const loginSchema = z.object({
	email: z.string().trim().min(1, "Email is required"),
	password: z.string().trim().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
	email: z.string().trim().min(1, "Email is required"),
});
