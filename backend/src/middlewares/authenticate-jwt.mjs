import { resolveAuthToken } from "../services/auth-token.service.mjs";

export const authenticateJWT = async (req, res, next) => {
	const authHeader = req.headers["authorization"];

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.sendStatus(401);
	}

	try {
		const userId = await resolveAuthToken(authHeader.slice("Bearer ".length));
		if (!userId) return res.sendStatus(403);
		req.userId = userId;
		return next();
	} catch (err) {
		return next(err);
	}
};
