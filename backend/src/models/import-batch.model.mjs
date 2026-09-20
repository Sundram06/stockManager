import mongoose from "mongoose";

const Schema = mongoose.Schema;

// One document per committed import. `entries` records, for every stock the
// import touched, what the stock looked like before (so undo can put it back)
// and a fingerprint of what it looked like after (so undo can refuse when the
// user has changed that stock since).
const entrySchema = new Schema(
	{
		stockId: { type: Schema.Types.ObjectId, required: true },
		stockName: { type: String, required: true },
		// created: stock didn't exist. merged: file trades added to it.
		// replaced: its lots and sells swapped for the file's. deleted: removed
		// by a replace-all import because the file didn't list it.
		action: { type: String, enum: ["created", "merged", "replaced", "deleted"], required: true },
		// { stock, lots, events } as raw documents; null for created stocks.
		before: { type: Schema.Types.Mixed, default: null },
		fingerprintAfter: { type: String, required: true },
		lotsAdded: { type: Number, default: 0 },
		sellsAdded: { type: Number, default: 0 },
	},
	{ _id: false },
);

const importBatchSchema = new Schema(
	{
		userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
		source: { type: String, required: true },
		fileName: { type: String, default: "" },
		fileHash: { type: String, required: true },
		status: { type: String, enum: ["COMMITTED", "UNDONE"], default: "COMMITTED" },
		replaceAll: { type: Boolean, default: false },
		entries: { type: [entrySchema], default: [] },
		undoneAt: Date,
	},
	{ timestamps: true },
);

importBatchSchema.index({ userId: 1, createdAt: -1 });
importBatchSchema.index({ userId: 1, fileHash: 1 });

export const ImportBatch =
	mongoose.models.ImportBatch || mongoose.model("ImportBatch", importBatchSchema);
