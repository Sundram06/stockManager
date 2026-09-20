import { API_URL } from "./config.mjs";
import { getValidTokenOrThrow } from "./session.mjs";

const readError = async (response, fallback) => {
	try {
		const body = await response.json();
		return body?.message || fallback;
	} catch {
		return fallback;
	}
};

async function request(path, { method = "GET", body, fallback }) {
	const token = getValidTokenOrThrow();
	const response = await fetch(`${API_URL}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${token}`,
			...(body && { "Content-Type": "application/json" }),
		},
		...(body && { body: JSON.stringify(body) }),
	});
	if (!response.ok) throw new Error(await readError(response, fallback));
	return response;
}

export const EXPORTS = {
	json: { path: "/api/export/json", fallbackName: "vittnest-backup.json" },
	holdings: { path: "/api/export/holdings.csv", fallbackName: "vittnest-holdings.csv" },
	transactions: { path: "/api/export/transactions.csv", fallbackName: "vittnest-transactions.csv" },
};

/** Fetches an export and hands it to the browser as a download. */
export async function downloadExport(kind) {
	const { path, fallbackName } = EXPORTS[kind];
	const response = await request(path, { fallback: "Couldn't prepare the download. Try again." });
	const disposition = response.headers.get("Content-Disposition") ?? "";
	const fileName = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;

	const url = URL.createObjectURL(await response.blob());
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
	return fileName;
}

export async function previewImport({ fileName, content }) {
	const response = await request("/api/import/preview", {
		method: "POST",
		body: { fileName, content },
		fallback: "Couldn't read this file.",
	});
	return response.json();
}

export async function commitImport(payload) {
	const response = await request("/api/import/commit", {
		method: "POST",
		body: payload,
		fallback: "Import failed. Nothing was changed.",
	});
	return response.json();
}

export async function listImports() {
	const response = await request("/api/import/batches", { fallback: "Couldn't load recent imports." });
	return response.json();
}

export async function undoImport(batchId) {
	const response = await request(`/api/import/batches/${encodeURIComponent(batchId)}/undo`, {
		method: "POST",
		fallback: "Couldn't undo this import.",
	});
	return response.json();
}
