/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Alert,
	Box,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	FormControlLabel,
	Link,
	Paper,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UploadFileIcon from "@mui/icons-material/UploadFileOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { commitImport, listImports, previewImport, undoImport } from "../util/api/transfer.mjs";
import { rupee, signedRupee } from "../util/format.mjs";

const MAX_BYTES = 4 * 1024 * 1024;

const count = (n) => (typeof n === "number" ? n.toLocaleString("en-IN") : "—");
const money = (n) => rupee(n);
const signedMoney = (n) => signedRupee(n);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const when = (iso) =>
	new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const STATUS = {
	new: { label: "New", color: "primary" },
	merge: { label: "Has new trades", color: "info" },
	unchanged: { label: "Already up to date", color: "default" },
	conflict: { label: "Needs your choice", color: "warning" },
	invalid: { label: "Can't import", color: "error" },
};

function effectiveChoice(stock, { choices, replaceAll }) {
	if (replaceAll) return stock.exists ? "replace" : "merge";
	return choices[stock.stockName] ?? stock.defaultChoice;
}

function optionsFor(stock) {
	if (!stock.exists) {
		return [
			{ value: "merge", label: "Add" },
			{ value: "keep", label: "Skip" },
		];
	}
	const list = [{ value: "keep", label: "Keep mine" }];
	if (stock.status !== "unchanged") list.push({ value: "merge", label: "Merge" });
	list.push({ value: "replace", label: "Use file's" });
	return list;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

function DropZone({ onFile, busy }) {
	const inputRef = useRef(null);
	const [over, setOver] = useState(false);

	const take = (files) => {
		const file = files?.[0];
		if (file) onFile(file);
	};

	return (
		<Paper
			variant="outlined"
			onDragOver={(e) => {
				e.preventDefault();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setOver(false);
				take(e.dataTransfer.files);
			}}
			sx={{
				borderStyle: "dashed",
				borderWidth: 2,
				borderColor: over ? "primary.main" : "divider",
				bgcolor: over ? "action.hover" : "background.paper",
				borderRadius: 2,
				px: 3,
				py: { xs: 4, sm: 6 },
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 1.5,
				textAlign: "center",
				transition: "border-color 0.15s ease, background-color 0.15s ease",
			}}
		>
			{busy ? (
				<CircularProgress size={32} />
			) : (
				<UploadFileIcon sx={{ fontSize: 40, color: "primary.main" }} />
			)}
			<Typography fontWeight={600}>{busy ? "Reading your file…" : "Drop your VittNest backup here"}</Typography>
			<Typography variant="body2" color="text.secondary">
				The <code>vittnest-backup-….json</code> file from Import / Export → Backup.
			</Typography>
			<Button variant="contained" onClick={() => inputRef.current?.click()} disabled={busy} sx={{ mt: 1 }}>
				Choose file
			</Button>
			<input
				ref={inputRef}
				id="import-file"
				type="file"
				accept=".json,application/json"
				hidden
				onChange={(e) => {
					take(e.target.files);
					e.target.value = "";
				}}
			/>
		</Paper>
	);
}

// ─── Preview rows ────────────────────────────────────────────────────────────

function Metric({ label, before, after, format, tone }) {
	const changed = before != null && after != null && before !== after;
	return (
		<Box sx={{ minWidth: 0 }}>
			<Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.04em" }}>
				{label}
			</Typography>
			<Typography
				sx={{
					fontVariantNumeric: "tabular-nums",
					fontWeight: 600,
					fontSize: "0.9rem",
					color: tone && after ? (after > 0 ? "success.main" : after < 0 ? "error.main" : undefined) : undefined,
				}}
			>
				{after == null ? "—" : format(after)}
			</Typography>
			{changed && (
				<Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
					was {format(before)}
				</Typography>
			)}
		</Box>
	);
}

function StockRow({ stock, choice, onChoose, locked }) {
	const status = STATUS[stock.status];
	const option = stock.options[choice];
	// Undecided: show what's there now until an option is picked.
	const after = !choice || choice === "keep" ? stock.before : option?.after ?? null;
	const before = stock.before;

	const detail = [
		`${plural(stock.file.lots, "buy")}, ${plural(stock.file.sells, "sale")} in file`,
		stock.exists && stock.duplicates.lots + stock.duplicates.sells > 0
			? `${stock.duplicates.lots + stock.duplicates.sells} already here`
			: null,
	]
		.filter(Boolean)
		.join(" · ");

	const failedReason = Object.values(stock.options).find((o) => !o.ok)?.reason;

	return (
		<Box
			sx={{
				display: "grid",
				gridTemplateColumns: { xs: "1fr", md: "minmax(180px, 1.2fr) minmax(260px, 1.6fr) auto" },
				gap: { xs: 1.5, md: 3 },
				alignItems: "center",
				px: { xs: 2, sm: 2.5 },
				py: 2,
				borderBottom: 1,
				borderColor: "divider",
				"&:last-of-type": { borderBottom: 0 },
			}}
		>
			<Box sx={{ minWidth: 0 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
					<Typography fontWeight={700}>{stock.stockName}</Typography>
					<Chip size="small" label={status.label} color={status.color} variant="outlined" />
				</Box>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					{detail}
				</Typography>
				{(stock.status === "conflict" || stock.status === "invalid") && failedReason && (
					<Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
						{failedReason}
					</Typography>
				)}
			</Box>

			<Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 2 }}>
				<Metric label="QTY" before={before?.quantity} after={after?.quantity} format={count} />
				<Metric label="AVG PRICE" before={before?.avgPrice} after={after?.avgPrice} format={money} />
				<Metric label="REALISED P&L" before={before?.realisedPnl} after={after?.realisedPnl} format={signedMoney} tone />
			</Box>

			<ToggleButtonGroup
				exclusive
				size="small"
				value={choice ?? null}
				onChange={(_e, value) => value && onChoose(value)}
				aria-label={`What to do with ${stock.stockName}`}
				sx={{ justifySelf: { xs: "start", md: "end" } }}
			>
				{optionsFor(stock).map(({ value, label }) => {
					const ok = stock.options[value]?.ok;
					const button = (
						<ToggleButton
							key={value}
							value={value}
							disabled={locked || !ok}
							sx={{ textTransform: "none", px: 1.5, fontWeight: 600, whiteSpace: "nowrap" }}
						>
							{label}
						</ToggleButton>
					);
					return ok ? (
						button
					) : (
						<Tooltip key={value} title={stock.options[value]?.reason ?? ""}>
							<span>{button}</span>
						</Tooltip>
					);
				})}
			</ToggleButtonGroup>
		</Box>
	);
}

// ─── Recent imports ──────────────────────────────────────────────────────────

function describe(batch) {
	const parts = [];
	const { created, merged, replaced, deleted } = batch.stocks;
	if (created) parts.push(`${created} added`);
	if (merged) parts.push(`${merged} merged`);
	if (replaced) parts.push(`${replaced} replaced`);
	if (deleted) parts.push(`${deleted} removed`);
	return parts.join(", ");
}

function RecentImports() {
	const queryClient = useQueryClient();
	const { data: batches = [] } = useQuery({ queryKey: ["imports"], queryFn: listImports });
	const [message, setMessage] = useState(null);
	const undo = useMutation({
		mutationFn: undoImport,
		onSuccess: () => {
			setMessage({ severity: "success", text: "Import undone. Your portfolio is back to how it was." });
			["stocks", "history", "imports"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
		},
		onError: (err) => setMessage({ severity: "error", text: err.message }),
	});

	if (!batches.length) return null;

	return (
		<Box component="section" sx={{ mt: 5 }}>
			<Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem", mb: 1.5 }}>
				Recent imports
			</Typography>
			{message && (
				<Alert severity={message.severity} onClose={() => setMessage(null)} sx={{ mb: 1.5 }}>
					{message.text}
				</Alert>
			)}
			<Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
				{batches.map((b) => (
					<Box
						key={b.id}
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 2,
							flexWrap: "wrap",
							px: 2.5,
							py: 1.5,
							borderBottom: 1,
							borderColor: "divider",
							"&:last-of-type": { borderBottom: 0 },
						}}
					>
						<Box sx={{ flex: 1, minWidth: 200 }}>
							<Typography fontWeight={600} sx={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
								{b.fileName || "Backup file"}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{when(b.createdAt)} · {describe(b)}
							</Typography>
						</Box>
						{b.status === "UNDONE" ? (
							<Chip size="small" label="Undone" variant="outlined" />
						) : b.canUndo ? (
							<Button
								size="small"
								variant="outlined"
								disabled={undo.isPending}
								onClick={() => undo.mutate(b.id)}
							>
								Undo
							</Button>
						) : (
							<Typography variant="caption" color="text.secondary">
								Undo expired
							</Typography>
						)}
					</Box>
				))}
			</Paper>
		</Box>
	);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ImportPage() {
	const user = useSelector((s) => s.auth.user);
	const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	// A file handed over by the empty-portfolio card; previewed once on arrival.
	const handedFile = useRef(location.state?.file ?? null);

	const [file, setFile] = useState(null);
	const [fileError, setFileError] = useState(null);
	const [choices, setChoices] = useState({});
	const [replaceAll, setReplaceAll] = useState(false);
	const [confirmText, setConfirmText] = useState("");

	useEffect(() => {
		if (!isAuthLoading && !user) navigate("/login", { replace: true });
	}, [user, isAuthLoading, navigate]);

	const preview = useMutation({ mutationFn: previewImport });
	const commit = useMutation({
		mutationFn: commitImport,
		onSuccess: (result) => {
			["stocks", "history", "imports"].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
			navigate("/dashboard", { state: { importResult: result } });
		},
	});

	const handleFile = async (picked) => {
		setFileError(null);
		setChoices({});
		setReplaceAll(false);
		setConfirmText("");
		commit.reset();
		if (picked.size > MAX_BYTES) {
			setFileError("This file is larger than 4 MB, which is too big for a VittNest backup.");
			return;
		}
		const content = await picked.text();
		setFile({ name: picked.name, content });
		preview.mutate({ fileName: picked.name, content });
	};

	useEffect(() => {
		const picked = handedFile.current;
		if (!picked || !user) return;
		handedFile.current = null;
		navigate(location.pathname, { replace: true, state: null });
		handleFile(picked);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user]);

	const reset = () => {
		setFile(null);
		preview.reset();
		commit.reset();
	};

	const data = preview.data;
	const ctx = { choices, replaceAll };
	const stocks = data?.stocks ?? [];
	const undecided = stocks.filter((s) => !effectiveChoice(s, ctx));
	const changing = stocks.filter((s) => effectiveChoice(s, ctx) && effectiveChoice(s, ctx) !== "keep");
	const confirmed = !replaceAll || confirmText.trim() === "REPLACE";
	const canCommit = data && !undecided.length && confirmed && (changing.length > 0 || (replaceAll && data.untouched.length > 0));

	const counts = stocks.reduce((acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }), {});
	const summary = [
		counts.new && `${counts.new} new`,
		counts.merge && `${counts.merge} with new trades`,
		counts.unchanged && `${counts.unchanged} already up to date`,
		counts.conflict && `${counts.conflict} need your choice`,
		counts.invalid && `${counts.invalid} can't be imported`,
	]
		.filter(Boolean)
		.join(" · ");

	const submit = () =>
		commit.mutate({
			fileName: file.name,
			content: file.content,
			choices: Object.fromEntries(stocks.map((s) => [s.stockName, effectiveChoice(s, ctx)])),
			...(replaceAll && { replaceAll: true, confirmReplaceAll: confirmText.trim() }),
		});

	if (isAuthLoading || !user) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2.5 }, width: "100%", maxWidth: 1100, mx: "auto" }}>
			<Link
				component={RouterLink}
				to="/dashboard"
				underline="hover"
				color="text.secondary"
				sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.85rem", mb: 1.5 }}
			>
				<ArrowBackIcon sx={{ fontSize: "1rem" }} /> Portfolio
			</Link>
			<Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: "1.2rem", sm: "1.6rem" }, mb: 0.75 }}>
				Restore a backup
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3, maxWidth: 640 }}>
				Nothing in your portfolio changes until you confirm. Trades you already have are skipped, and you can undo
				an import for 7 days.
			</Typography>

			{!file && <DropZone onFile={handleFile} busy={preview.isPending} />}
			{fileError && (
				<Alert severity="error" sx={{ mt: 2 }}>
					{fileError}
				</Alert>
			)}

			{file && (
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
					<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
						<InsertDriveFileIcon color="primary" />
						<Typography fontWeight={600} sx={{ wordBreak: "break-all" }}>
							{file.name}
						</Typography>
						{data?.exportedAt && (
							<Typography variant="body2" color="text.secondary">
								exported {when(data.exportedAt)}
							</Typography>
						)}
						<Button size="small" onClick={reset} sx={{ ml: "auto" }}>
							Choose another file
						</Button>
					</Box>

					{preview.isPending && <CircularProgress size={28} sx={{ alignSelf: "center", my: 4 }} />}
					{preview.isError && <Alert severity="error">{preview.error.message}</Alert>}

					{data && (
						<>
							{data.alreadyImported && (
								<Alert severity="info">
									You imported this file on {when(data.alreadyImported.createdAt)}. Trades already in your
									portfolio will be skipped.
								</Alert>
							)}
							{!stocks.length && <Alert severity="info">This backup has no stocks in it.</Alert>}

							{stocks.length > 0 && (
								<Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
									<Box
										sx={{
											px: { xs: 2, sm: 2.5 },
											py: 1.5,
											borderBottom: 1,
											borderColor: "divider",
											bgcolor: "action.hover",
										}}
									>
										<Typography fontWeight={700} sx={{ fontSize: "0.9rem" }}>
											{plural(stocks.length, "stock")} in this file
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{summary}
										</Typography>
									</Box>
									{stocks.map((stock) => (
										<StockRow
											key={stock.stockName}
											stock={stock}
											choice={effectiveChoice(stock, ctx)}
											locked={replaceAll}
											onChoose={(value) => setChoices((c) => ({ ...c, [stock.stockName]: value }))}
										/>
									))}
								</Paper>
							)}

							<Paper
								variant="outlined"
								sx={{
									borderRadius: 2,
									px: { xs: 2, sm: 2.5 },
									py: 1.5,
									borderColor: replaceAll ? "error.main" : "divider",
								}}
							>
								<FormControlLabel
									control={
										<Checkbox
											id="replace-all"
											checked={replaceAll}
											onChange={(e) => {
												setReplaceAll(e.target.checked);
												setConfirmText("");
											}}
										/>
									}
									label={
										<Typography fontWeight={600} sx={{ fontSize: "0.9rem" }}>
											Replace my whole portfolio with this file
										</Typography>
									}
								/>
								{replaceAll && (
									<Box sx={{ pl: { xs: 0, sm: 4 }, pb: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
										<Typography variant="body2" color="text.secondary">
											Every stock becomes exactly what the file says.
											{data.untouched.length > 0 && (
												<>
													{" "}
													These aren&apos;t in the file and will be removed:{" "}
													<strong>{data.untouched.map((u) => u.stockName).join(", ")}</strong>.
												</>
											)}
										</Typography>
										<TextField
											id="replace-confirm"
											size="small"
											label="Type REPLACE to confirm"
											value={confirmText}
											onChange={(e) => setConfirmText(e.target.value)}
											sx={{ maxWidth: 280 }}
											autoComplete="off"
										/>
									</Box>
								)}
							</Paper>

							{commit.isError && <Alert severity="error">{commit.error.message}</Alert>}

							<Box sx={{ display: "flex", gap: 1.5, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
								{undecided.length > 0 && (
									<Typography variant="body2" color="warning.main" sx={{ mr: "auto" }}>
										Choose what to do with {undecided.map((s) => s.stockName).join(", ")}.
									</Typography>
								)}
								<Button component={RouterLink} to="/dashboard" color="inherit">
									Cancel
								</Button>
								<Button
									variant="contained"
									color={replaceAll ? "error" : "primary"}
									disabled={!canCommit || commit.isPending}
									onClick={submit}
									startIcon={commit.isPending ? <CircularProgress size={16} color="inherit" /> : null}
								>
									{replaceAll
										? "Replace portfolio"
										: changing.length
											? `Import ${plural(changing.length, "stock")}`
											: "Nothing new to import"}
								</Button>
							</Box>
						</>
					)}
				</Box>
			)}

			<RecentImports />
		</Box>
	);
}
