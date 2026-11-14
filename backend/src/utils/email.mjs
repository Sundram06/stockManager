import nodemailer from "nodemailer";
import { env, isProduction } from "../config/env.mjs";
import { logError, logInfo } from "./logger.mjs";

function createTransport() {
	if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return null;

	return nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: env.GMAIL_USER,
			pass: env.GMAIL_APP_PASSWORD,
		},
	});
}

/**
 * Sends one email. Without Gmail credentials nothing is sent; in development
 * the link is logged so sign-up and reset can still be tested locally. Links
 * carry live tokens, so they are never logged in production.
 */
async function sendEmail({ to, subject, html, link }) {
	const transporter = createTransport();

	if (!transporter) {
		if (isProduction) {
			logError("Email not sent: Gmail credentials are not configured", { subject });
		} else {
			logInfo("Email not sent: Gmail credentials are not configured", { subject, link });
		}
		return;
	}

	try {
		const info = await transporter.sendMail({ from: `VittNest <${env.GMAIL_USER}>`, to, subject, html });
		logInfo("Email sent", { subject, messageId: info.messageId });
	} catch (err) {
		logError("Email failed", { subject, errorMessage: err.message });
		throw err;
	}
}

export const sendPasswordResetEmail = ({ to, resetUrl }) =>
	sendEmail({
		to,
		subject: "Reset your VittNest password",
		link: resetUrl,
		html: `
			<p>Hi,</p>
			<p>You requested a password reset. Click the link below. It expires in 1 hour.</p>
			<p><a href="${resetUrl}">${resetUrl}</a></p>
			<p>If you did not request this, ignore this email.</p>
		`,
	});

export const sendVerificationEmail = ({ to, verifyUrl }) =>
	sendEmail({
		to,
		subject: "Verify your VittNest email",
		link: verifyUrl,
		html: `
			<p>Hi,</p>
			<p>Thanks for registering! Please verify your email address by clicking the link below. It expires in 24 hours.</p>
			<p><a href="${verifyUrl}">${verifyUrl}</a></p>
			<p>If you did not create an account, ignore this email.</p>
		`,
	});

// Sent instead of a reset link when the account signs in with Google, so the
// forgot-password response can stay the same for every address.
export const sendGoogleAccountNotice = ({ to, loginUrl }) =>
	sendEmail({
		to,
		subject: "Signing in to VittNest",
		link: loginUrl,
		html: `
			<p>Hi,</p>
			<p>Someone asked to reset the password for this email address. Your VittNest account signs in with Google, so there is no password to reset.</p>
			<p>Use <strong>Continue with Google</strong> on the <a href="${loginUrl}">sign-in page</a>.</p>
			<p>If you did not request this, ignore this email.</p>
		`,
	});
