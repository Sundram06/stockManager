import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Divider,
	ListItemIcon,
	ListItemText,
	ListSubheader,
	Menu,
	MenuItem,
	CircularProgress,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RestoreIcon from "@mui/icons-material/SettingsBackupRestore";
import AccountBalanceIcon from "@mui/icons-material/AccountBalanceOutlined";
import useExportDownload, { EXPORT_ITEMS } from "../hooks/useExportDownload";

const subheaderSx = {
	lineHeight: "32px",
	fontSize: "0.75rem",
	fontWeight: 600,
	color: "text.secondary",
	bgcolor: "transparent",
};

// Desktop only. On phones the same actions live in the Add button's sheet.
export default function ImportExportMenu() {
	const navigate = useNavigate();
	const [anchor, setAnchor] = useState(null);
	const { busy, download, toast } = useExportDownload();

	const close = () => setAnchor(null);

	return (
		<>
			<Button
				variant="outlined"
				color="inherit"
				onClick={(e) => setAnchor(e.currentTarget)}
				startIcon={
					busy ? <CircularProgress size={16} color="inherit" /> : <SwapVertIcon sx={{ fontSize: "1.1rem !important" }} />
				}
				endIcon={<KeyboardArrowDownIcon sx={{ fontSize: "1rem !important" }} />}
				aria-haspopup="menu"
				aria-expanded={Boolean(anchor)}
				sx={{
					display: { xs: "none", sm: "inline-flex" },
					px: 1.75,
					py: 0.7,
					fontSize: "0.8rem",
					fontWeight: 600,
					whiteSpace: "nowrap",
					flexShrink: 0,
					borderColor: "divider",
					color: "text.primary",
				}}
			>
				Import / Export
			</Button>

			<Menu
				anchorEl={anchor}
				open={Boolean(anchor)}
				onClose={close}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
				transformOrigin={{ vertical: "top", horizontal: "right" }}
				PaperProps={{ sx: { minWidth: 260, mt: 0.5 } }}
			>
				<ListSubheader sx={subheaderSx}>Import</ListSubheader>
				<MenuItem
					onClick={() => {
						close();
						navigate("/import");
					}}
				>
					<ListItemIcon>
						<RestoreIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Restore a VittNest backup" secondary="Preview before anything changes" />
				</MenuItem>
				<MenuItem disabled>
					<ListItemIcon>
						<AccountBalanceIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="From Zerodha, Groww, Upstox…" secondary="Coming soon" />
				</MenuItem>
				<Divider />
				<ListSubheader sx={subheaderSx}>Export</ListSubheader>
				{EXPORT_ITEMS.map(({ kind, Icon, primary, secondary }) => (
					<MenuItem
						key={kind}
						onClick={() => {
							close();
							download(kind);
						}}
						disabled={Boolean(busy)}
					>
						<ListItemIcon>
							<Icon fontSize="small" />
						</ListItemIcon>
						<ListItemText primary={primary} secondary={secondary} />
					</MenuItem>
				))}
			</Menu>

			{toast}
		</>
	);
}
