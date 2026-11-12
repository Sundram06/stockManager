import express from "express";

export const IMPORT_PATH_PREFIX = "/api/import/";

const defaultJsonBody = express.json({ limit: "100kb" });

/** Body parser for import routes, which carry a whole backup file. Mount after authentication. */
export const importJsonBody = express.json({ limit: "5mb" });

/**
 * App-wide body parser. Skips import routes so their larger body is parsed
 * only once the request is authenticated; an anonymous caller can never make
 * the server read 5 MB.
 */
export const jsonBody = (req, res, next) =>
	req.path.startsWith(IMPORT_PATH_PREFIX) ? next() : defaultJsonBody(req, res, next);
