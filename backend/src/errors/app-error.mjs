export class AppError extends Error {
	/**
	 * @param {string} message           shown to the user
	 * @param {number} [statusCode=500]
	 * @param {object} [options]
	 * @param {string} [options.code]    machine-readable reason the frontend can branch on
	 * @param {*} [options.details]
	 */
	constructor(message, statusCode = 500, { code = null, details = null } = {}) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
	}
}
