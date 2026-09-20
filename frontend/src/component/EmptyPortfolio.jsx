/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RestoreIcon from "@mui/icons-material/SettingsBackupRestore";

const panelSx = {
	flex: 1,
	minWidth: 0,
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	gap: 1,
	p: { xs: 2, sm: 2.5 },
	borderRadius: 2,
	border: 1,
	borderColor: "divider",
};

const iconSx = {
	width: 36,
	height: 36,
	borderRadius: "50%",
	display: "grid",
	placeItems: "center",
	mb: 0.5,
};

/**
 * Shown instead of the table when the account has no stocks at all: the two
 * ways to get started. The backup side takes a dropped or chosen file and
 * goes straight to its preview.
 */
export default function EmptyPortfolio({ onAddStock }) {
	const navigate = useNavigate();
	const inputRef = useRef(null);
	const [over, setOver] = useState(false);

	const restore = (file) => {
		if (file) navigate("/import", { state: { file } });
	};

	return (
		<Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 } }}>
			<Typography
				component="h2"
				sx={{
					fontFamily: '"Newsreader", Georgia, serif',
					fontWeight: 600,
					fontSize: { xs: "1.5rem", sm: "1.85rem" },
					lineHeight: 1.15,
					letterSpacing: "-0.01em",
					mb: 1,
				}}
			>
				Start your portfolio
			</Typography>
			<Typography color="text.secondary" sx={{ maxWidth: 560, mb: 3, fontSize: "0.95rem" }}>
				Record the shares you own. VittNest tracks live prices, your average cost, and profit on every lot you
				sell.
			</Typography>

			<Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
				<Box sx={panelSx}>
					<Box sx={{ ...iconSx, bgcolor: "primary.main", color: "primary.contrastText" }}>
						<AddIcon fontSize="small" />
					</Box>
					<Typography fontWeight={700}>Add your first stock</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
						Search a symbol, then enter how many shares you bought, the price, and the date.
					</Typography>
					<Button variant="contained" onClick={onAddStock} sx={{ mt: 1, boxShadow: "none" }}>
						Add stock
					</Button>
				</Box>

				<Box
					onDragOver={(e) => {
						e.preventDefault();
						setOver(true);
					}}
					onDragLeave={() => setOver(false)}
					onDrop={(e) => {
						e.preventDefault();
						setOver(false);
						restore(e.dataTransfer.files?.[0]);
					}}
					sx={{
						...panelSx,
						borderStyle: "dashed",
						borderWidth: 2,
						borderColor: over ? "primary.main" : "divider",
						bgcolor: over ? "action.hover" : "transparent",
						transition: "border-color 0.15s ease, background-color 0.15s ease",
					}}
				>
					<Box sx={{ ...iconSx, border: 1, borderColor: "divider", color: "primary.main" }}>
						<RestoreIcon fontSize="small" />
					</Box>
					<Typography fontWeight={700}>Restore a backup</Typography>
					<Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
						Choose or drop a <code>vittnest-backup</code> file to bring back every buy and sale. You&apos;ll see a
						preview before anything is added.
					</Typography>
					<Button variant="outlined" onClick={() => inputRef.current?.click()} sx={{ mt: 1 }}>
						Choose backup file
					</Button>
					<input
						ref={inputRef}
						id="empty-portfolio-backup"
						type="file"
						accept=".json,application/json"
						hidden
						onChange={(e) => {
							restore(e.target.files?.[0]);
							e.target.value = "";
						}}
					/>
				</Box>
			</Box>

			<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
				Importing from Zerodha, Groww or Upstox is coming soon.
			</Typography>
		</Box>
	);
}
