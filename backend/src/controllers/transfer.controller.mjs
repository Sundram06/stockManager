import { buildBackup, buildHoldingsCsv, buildTransactionsCsv } from "../services/export.service.mjs";
import { commitImport, listImports, previewImport, undoImport } from "../services/import.service.mjs";

// YYYY-MM-DD in India time, so a file made after midnight IST isn't named for yesterday.
const stamp = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const sendFile = (res, { body, type, name }) => {
	res.setHeader("Content-Type", type);
	res.setHeader("Content-Disposition", `attachment; filename="${name}"`);
	res.setHeader("Cache-Control", "no-store");
	return res.send(body);
};

export const exportJson = async (req, res) => {
	const backup = await buildBackup(req.userId);
	return sendFile(res, {
		body: JSON.stringify(backup, null, 2),
		type: "application/json; charset=utf-8",
		name: `vittnest-backup-${stamp()}.json`,
	});
};

// The BOM makes Excel open the file as UTF-8.
export const exportHoldingsCsv = async (req, res) =>
	sendFile(res, {
		body: `﻿${await buildHoldingsCsv(req.userId)}`,
		type: "text/csv; charset=utf-8",
		name: `vittnest-holdings-${stamp()}.csv`,
	});

export const exportTransactionsCsv = async (req, res) =>
	sendFile(res, {
		body: `﻿${await buildTransactionsCsv(req.userId)}`,
		type: "text/csv; charset=utf-8",
		name: `vittnest-transactions-${stamp()}.csv`,
	});

export const importPreview = async (req, res) => res.json(await previewImport(req.userId, req.validated));

export const importCommit = async (req, res) => res.json(await commitImport(req.userId, req.validated));

export const importList = async (req, res) => res.json(await listImports(req.userId));

export const importUndo = async (req, res) => res.json(await undoImport(req.userId, req.params.id));
