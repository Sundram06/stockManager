import jwt from "jsonwebtoken";
import { env } from "../config/env.mjs";

export const authenticateJWT = (req, res, next) => {
	const authHeader = req.headers["authorization"];

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}

	const token = authHeader.split(" ")[1];
	jwt.verify(token, env.JWT_SECRET, (err, payload) => {
		if (err) {
			return res.sendStatus(403);
		}

		req.userId = payload.userId;
		return next();
	});
};
