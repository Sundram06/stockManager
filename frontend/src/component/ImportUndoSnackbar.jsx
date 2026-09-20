/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, CircularProgress, Snackbar } from "@mui/material";
import { undoImport } from "../util/api/transfer.mjs";

function summarise(batch) {
	const { created, merged, replaced, deleted } = batch.stocks;
	const parts = [];
	if (created) parts.push(`${created} added`);
	if (merged) parts.push(`${merged} merged`);
	if (replaced) parts.push(`${replaced} replaced`);
	if (deleted) parts.push(`${deleted} removed`);
	return `Import done: ${parts.join(", ")}.`;
}

/**
 * Shown on the dashboard right after an import, with an Undo action. The same
 * undo stays available on the import page for 7 days.
 */
export default function ImportUndoSnackbar({ result }) {
	const queryClient = useQueryClient();
	const [open, setOpen] = useState(Boolean(result));
	const [outcome, setOutcome] = useState(null);

	const undo = useMutation({
		mutationFn: () => undoImport(result.batch.id),
		onSuccess: () => {
			["stocks", "history", "imports"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
			setOutcome({ severity: "success", message: "Import undone. Your portfolio is back to how it was." });
		},
		onError: (err) => setOutcome({ severity: "error", message: err.message }),
	});

	if (!result) return null;

	const close = (_e, reason) => {
		if (reason === "clickaway" || undo.isPending) return;
		setOpen(false);
	};

	let severity = "success";
	let message = result.batch ? summarise(result.batch) : result.message;
	let action = result.batch ? (
		<Button color="inherit" size="small" onClick={() => undo.mutate()} disabled={undo.isPending}>
			{undo.isPending ? <CircularProgress size={14} color="inherit" /> : "Undo"}
		</Button>
	) : null;
	if (!result.batch) severity = "info";
	if (outcome) {
		({ severity, message } = outcome);
		action = null;
	}

	return (
		<Snackbar
			key={outcome ? "outcome" : "result"}
			open={open}
			autoHideDuration={outcome ? 5000 : 12000}
			onClose={close}
			anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
		>
			<Alert severity={severity} variant="filled" action={action} onClose={() => setOpen(false)} sx={{ alignItems: "center" }}>
				{message}
			</Alert>
		</Snackbar>
	);
}
