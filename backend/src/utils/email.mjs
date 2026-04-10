import nodemailer from "nodemailer";
import { env } from "../config/env.mjs";

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
 * Send a password reset email.
 * Falls back to console.log when Gmail credentials are not configured.
 */
export async function sendPasswordResetEmail({ to, resetUrl }) {
	const transporter = createTransport();

	if (!transporter) {
		console.log(`[email] No Gmail credentials — reset link for ${to}: ${resetUrl}`);
		return;
	}

	console.log(`[email] Attempting sendMail to ${to} from ${env.GMAIL_USER}`);
	try {
		const info = await transporter.sendMail({
			from: `VittNest <${env.GMAIL_USER}>`,
			to,
			subject: "Reset your VittNest password",
			html: `
				<p>Hi,</p>
				<p>You requested a password reset. Click the link below — it expires in 1 hour.</p>
				<p><a href="${resetUrl}">${resetUrl}</a></p>
				<p>If you did not request this, ignore this email.</p>
			`,
		});
		console.log(`[email] Sent OK — messageId=${info.messageId}`);
	} catch (err) {
		console.error(`[email] sendMail failed:`, err.message);
		throw err;
	}
}

export async function sendVerificationEmail({ to, verifyUrl }) {
	const transporter = createTransport();

	if (!transporter) {
		console.log(`[email] No Gmail credentials — verify link for ${to}: ${verifyUrl}`);
		return;
	}

	try {
		const info = await transporter.sendMail({
			from: `VittNest <${env.GMAIL_USER}>`,
			to,
			subject: "Verify your VittNest email",
			html: `
				<p>Hi,</p>
				<p>Thanks for registering! Please verify your email address by clicking the link below — it expires in 24 hours.</p>
				<p><a href="${verifyUrl}">${verifyUrl}</a></p>
				<p>If you did not create an account, ignore this email.</p>
			`,
		});
		console.log(`[email] Verification sent OK — messageId=${info.messageId}`);
	} catch (err) {
		console.error(`[email] sendMail failed:`, err.message);
		throw err;
	}
}
