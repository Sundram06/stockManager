import { useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import DataObjectIcon from "@mui/icons-material/DataObject";
import TableChartIcon from "@mui/icons-material/TableChartOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongOutlined";
import { downloadExport } from "../util/api/transfer.mjs";

// The three downloads, shared by the desktop menu and the mobile action sheet.
export const EXPORT_ITEMS = [
	{ kind: "json", Icon: DataObjectIcon, primary: "Backup (JSON)", secondary: "Everything, restorable" },
	{ kind: "holdings", Icon: TableChartIcon, primary: "Holdings (CSV)", secondary: "One row per stock" },
	{ kind: "transactions", Icon: ReceiptLongIcon, primary: "Transactions (CSV)", secondary: "Every buy and sale" },
];

/**
 * Downloads an export and reports the result in a toast.
 * Render `toast` once wherever the hook is used.
 */
export default function useExportDownload() {
	const [busy, setBusy] = useState(null);
	const [result, setResult] = useState(null);

	const download = async (kind) => {
		setBusy(kind);
		try {
			const fileName = await downloadExport(kind);
			setResult({ severity: "success", message: `Downloaded ${fileName}` });
		} catch (err) {
			setResult({ severity: "error", message: err.message });
		} finally {
			setBusy(null);
		}
	};

	const toast = (
		<Snackbar
			open={Boolean(result)}
			autoHideDuration={4000}
			onClose={() => setResult(null)}
			anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
		>
			{result ? (
				<Alert severity={result.severity} variant="filled" onClose={() => setResult(null)}>
					{result.message}
				</Alert>
			) : (
				<span />
			)}
		</Snackbar>
	);

	return { busy, download, toast };
}
