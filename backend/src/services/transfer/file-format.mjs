import { createHash } from "node:crypto";

/**
 * Thrown by a parser when a file can't be read. The message reaches the user,
 * so it should say what is wrong with the file.
 */
export class FileFormatError extends Error {}

export const hashContent = (content) => createHash("sha256").update(content).digest("hex");

export const normalizeSymbol = (name) => String(name ?? "").trim().toUpperCase();
