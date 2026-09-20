import { createHash } from "node:crypto";

/**
 * Thrown by a parser when a file can't be read. The message is shown to the
 * user, so say what's wrong with the file, not what the code expected.
 */
export class FileFormatError extends Error {}

export const hashContent = (content) => createHash("sha256").update(content).digest("hex");

export const normalizeSymbol = (name) => String(name ?? "").trim().toUpperCase();
