import { AppError } from "../errors/app-error.mjs";
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

	logError("Unhandled error", {
		requestId: req.requestId,
		path: req.originalUrl,
		method: req.method,
		errorName: err?.name,
		errorMessage: err?.message,
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
