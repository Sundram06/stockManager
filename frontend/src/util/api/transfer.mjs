import { apiFetch, apiJson } from "./request.mjs";

export const EXPORTS = {
	json: { path: "/api/export/json", fallbackName: "vittnest-backup.json" },
	holdings: { path: "/api/export/holdings.csv", fallbackName: "vittnest-holdings.csv" },
	transactions: { path: "/api/export/transactions.csv", fallbackName: "vittnest-transactions.csv" },
};

/** Fetches an export and hands it to the browser as a download. */
export async function downloadExport(kind) {
	const { path, fallbackName } = EXPORTS[kind];
	const response = await apiFetch(path, { fallback: "Couldn't prepare the download. Try again." });
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

export const previewImport = ({ fileName, content }) =>
	apiJson("/api/import/preview", {
		method: "POST",
		body: { fileName, content },
		fallback: "Couldn't read this file.",
	});

export const commitImport = (payload) =>
	apiJson("/api/import/commit", {
		method: "POST",
		body: payload,
		fallback: "Import failed. Nothing was changed.",
	});

export const listImports = () =>
	apiJson("/api/import/batches", { fallback: "Couldn't load recent imports." });

export const undoImport = (batchId) =>
	apiJson(`/api/import/batches/${encodeURIComponent(batchId)}/undo`, {
		method: "POST",
		fallback: "Couldn't undo this import.",
	});
