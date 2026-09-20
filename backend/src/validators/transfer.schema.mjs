import { z } from "zod";

const content = z
	.string({ message: "Choose a file to import" })
	.min(1, "The file is empty")
	.max(4 * 1024 * 1024, "The file is too large (4 MB max)");

export const importPreviewSchema = z.object({
	fileName: z.string().max(255).optional(),
	content,
});

export const importCommitSchema = z.object({
	fileName: z.string().max(255).optional(),
	content,
	choices: z.record(z.enum(["keep", "merge", "replace"])).optional(),
	replaceAll: z.boolean().optional(),
	confirmReplaceAll: z.string().optional(),
});
