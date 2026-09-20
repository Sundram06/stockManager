import { API_URL } from "./config.mjs";
import { getValidTokenOrThrow } from "./session.mjs";

async function toError(response, fallback) {
	const data = await response.json().catch(() => ({}));
	const error = new Error(data?.message || fallback);
	// Codes like EMAIL_NOT_VERIFIED and GOOGLE_ACCOUNT are what the UI branches on.
	if (data?.code) error.code = data.code;
	error.status = response.status;
	return error;
}

/**
 * Calls the backend and returns the raw Response, for downloads or when the
 * headers matter. Throws on any non-2xx.
 *
 * @param {string} path            e.g. "/stocks"
 * @param {object} [options]
 * @param {string} [options.method="GET"]
 * @param {*} [options.body]       JSON-encoded when present
 * @param {boolean} [options.auth=true]  send the bearer token
 * @param {string} [options.fallback]    message used when the server sends none
 */
export async function apiFetch(path, { method = "GET", body, auth = true, fallback = "Something went wrong. Try again." } = {}) {
	const headers = {};
	if (auth) headers.Authorization = `Bearer ${getValidTokenOrThrow()}`;
	if (body !== undefined) headers["Content-Type"] = "application/json";

	const response = await fetch(`${API_URL}${path}`, {
		method,
		headers,
		...(body !== undefined && { body: JSON.stringify(body) }),
	});

	if (!response.ok) throw await toError(response, fallback);
	return response;
}

/** Same, parsed as JSON. Returns null for an empty (204) response. */
export async function apiJson(path, options) {
	const response = await apiFetch(path, options);
	return response.status === 204 ? null : response.json();
}
