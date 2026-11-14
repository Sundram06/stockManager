import { submitContactMessage } from "../services/contact.service.mjs";

export const contact = async (req, res) => {
	const result = await submitContactMessage(req.validated);
	return res.json(result);
};
