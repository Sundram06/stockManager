import { apiJson } from "./request.mjs";

/** Sends a contact-form message. The server emails it on; the address is never sent to the browser. */
export const sendContactMessage = (message) =>
	apiJson("/api/contact", { method: "POST", body: message, auth: false, fallback: "Your message could not be sent. Try again." });
