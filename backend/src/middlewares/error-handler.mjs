import { AppError } from "../errors/app-error.mjs";
import { isProduction } from "../config/env.mjs";
import { logError } from "../utils/logger.mjs";

export const errorHandler = (err, req, res, next) => {
	if (res.headersSent) {
		return next(err);
	}

	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
			error: {
				message: err.message,
				details: err.details,
				requestId: req.requestId,
			},
		});
	}

	if (err?.type === "entity.too.large") {
		const message = "The file is too large to import (5 MB max).";
		return res.status(413).json({ success: false, message, error: { message, requestId: req.requestId } });
	}

	logError("Unhandled error", {
		requestId: req.requestId,
		path: req.originalUrl,
		method: req.method,
		errorName: err?.name,
		errorMessage: err?.message,
		// OAuth token-exchange failures carry the provider's own reason here;
		// without it the log says only "TokenError".
		...(err?.code && { errorCode: err.code }),
		...(err?.oauthError && { oauthError: err.oauthError }),
		...(!isProduction && err?.stack && { stack: err.stack }),
	});

	return res.status(500).json({
		success: false,
		message: "Internal server error",
		error: {
			message: "Internal server error",
			requestId: req.requestId,
		},
	});
};
