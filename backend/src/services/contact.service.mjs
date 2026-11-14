import { env } from "../config/env.mjs";
import { AppError } from "../errors/app-error.mjs";
import { sendContactMessage } from "../utils/email.mjs";

export const submitContactMessage = async ({ name, email, message }) => {
	if (!env.CONTACT_EMAIL) {
		throw new AppError("The contact form is not available right now. Try again later.", 503, {
			code: "CONTACT_UNAVAILABLE",
		});
	}
	await sendContactMessage({ to: env.CONTACT_EMAIL, name, email, message });
	return { message: "Thanks, your message has been sent. We'll reply by email." };
};
