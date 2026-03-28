export const validateRequest = (schema, pick = (req) => req.body) => {
	return (req, res, next) => {
		if (!schema) {
			return next();
		}

		const payload = pick(req);

		if (typeof schema.safeParse === "function") {
			const parsed = schema.safeParse(payload);
			if (!parsed.success) {
				const firstIssue = parsed.error?.issues?.[0]?.message;
				return res
					.status(400)
					.json({ message: firstIssue || "Validation failed" });
			}

			req.validated = parsed.data;
			return next();
		}

		if (typeof schema.parse !== "function") {
			return next();
		}

		const parsed = schema.parse(payload);
		if (!parsed.success) {
			return res
				.status(400)
				.json({ message: parsed.error || "Validation failed" });
		}

		req.validated = parsed.data;
		return next();
	};
};
