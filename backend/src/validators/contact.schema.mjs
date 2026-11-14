import { z } from "zod";

export const contactSchema = z.object({
	// Single line: the name goes into the email subject header.
	name: z
		.string()
		.trim()
		.min(1, "Enter your name")
		.max(100, "Name is too long")
		.regex(/^[^\r\n]*$/, "Name must be on one line"),
	email: z.string().trim().email("Enter a valid email address"),
	message: z
		.string()
		.trim()
		.min(10, "Message must be at least 10 characters")
		.max(5000, "Message must be at most 5,000 characters"),
	// Hidden field people never see; bots that fill every input are refused.
	website: z.string().max(0, "Message could not be sent").optional(),
});
