import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const buildBackupMock = vi.fn();
const previewImportMock = vi.fn();
const undoImportMock = vi.fn();

vi.mock("../../src/middlewares/authenticate-jwt.mjs", () => ({
	authenticateJWT: (req, res, next) => {
		req.userId = "test-user-id";
		next();
	},
}));

vi.mock("../../src/services/export.service.mjs", () => ({
	buildBackup: buildBackupMock,
	buildHoldingsCsv: vi.fn(async () => "Symbol\r\n"),
	buildTransactionsCsv: vi.fn(async () => "Date\r\n"),
}));

vi.mock("../../src/services/import.service.mjs", () => ({
	previewImport: previewImportMock,
	commitImport: vi.fn(),
	listImports: vi.fn(async () => []),
	undoImport: undoImportMock,
}));

const { createApp } = await import("../../src/app.mjs");

describe("import/export routes", () => {
	const app = createApp();

	beforeEach(() => vi.clearAllMocks());

	it("serves the backup as a named JSON download", async () => {
		buildBackupMock.mockResolvedValueOnce({ app: "vittnest", stocks: [] });
		const res = await request(app).get("/api/export/json");

		expect(res.status).toBe(200);
		expect(res.headers["content-disposition"]).toMatch(/^attachment; filename="vittnest-backup-\d{4}-\d{2}-\d{2}\.json"$/);
		expect(JSON.parse(res.text)).toEqual({ app: "vittnest", stocks: [] });
		expect(buildBackupMock).toHaveBeenCalledWith("test-user-id");
	});

	it("serves CSVs with a BOM so Excel reads them as UTF-8", async () => {
		const res = await request(app).get("/api/export/holdings.csv");
		expect(res.headers["content-type"]).toMatch(/text\/csv/);
		expect(res.text.charCodeAt(0)).toBe(0xfeff);
	});

	it("rejects a preview with no file content", async () => {
		const res = await request(app).post("/api/import/preview").send({ fileName: "x.json" });
		expect(res.status).toBe(400);
		expect(previewImportMock).not.toHaveBeenCalled();
	});

	it("answers an oversized upload with a readable 413", async () => {
		const res = await request(app)
			.post("/api/import/preview")
			.set("Content-Type", "application/json")
			.send(JSON.stringify({ content: "x".repeat(6 * 1024 * 1024) }));
		expect(res.status).toBe(413);
		expect(res.body.message).toMatch(/too large/);
	});

	it("passes the batch id to undo", async () => {
		undoImportMock.mockResolvedValueOnce({ batch: { id: "b1" } });
		const res = await request(app).post("/api/import/batches/b1/undo");
		expect(res.status).toBe(200);
		expect(undoImportMock).toHaveBeenCalledWith("test-user-id", "b1");
	});
});
