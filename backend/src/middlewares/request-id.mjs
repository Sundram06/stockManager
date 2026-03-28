import crypto from "crypto";

export const requestId = (req, res, next) => {
	const incomingId = req.headers["x-request-id"];
	const id =
		typeof incomingId === "string" && incomingId.trim().length > 0
			? incomingId.trim()
			: crypto.randomUUID();

	req.requestId = id;
	res.setHeader("x-request-id", id);
	next();
};
