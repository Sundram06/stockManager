/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import {
	Box,
	CircularProgress,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	SwipeableDrawer,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RestoreIcon from "@mui/icons-material/SettingsBackupRestore";
import useExportDownload, { EXPORT_ITEMS } from "../hooks/useExportDownload";

const groupLabelSx = { px: 2.5, pt: 1.5, pb: 0.5, fontSize: "0.75rem", fontWeight: 600, color: "text.secondary" };
const rowSx = { px: 2.5, py: 1.25, minHeight: 56 };

/**
 * Bottom sheet behind the mobile Add button: add a stock, restore a backup,
 * or download one of the exports.
 */
export default function MobileActionSheet({ open, onOpen, onClose, onAddStock }) {
	const navigate = useNavigate();
	const { busy, download, toast } = useExportDownload();

	return (
		<>
			<SwipeableDrawer
				anchor="bottom"
				open={open}
				onOpen={onOpen}
				onClose={onClose}
				disableSwipeToOpen
				PaperProps={{
					sx: {
						borderTopLeftRadius: 16,
						borderTopRightRadius: 16,
						pb: "calc(8px + env(safe-area-inset-bottom))",
						backgroundImage: "none",
					},
				}}
			>
				<Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: "divider", mx: "auto", mt: 1.25, mb: 0.5 }} />
				<List disablePadding aria-label="Portfolio actions">
					<ListItemButton
						sx={rowSx}
						onClick={() => {
							onClose();
							onAddStock();
						}}
					>
						<ListItemIcon sx={{ minWidth: 48 }}>
							<Box
								sx={{
									width: 32,
									height: 32,
									borderRadius: "50%",
									bgcolor: "primary.main",
									color: "primary.contrastText",
									display: "grid",
									placeItems: "center",
								}}
							>
								<AddIcon fontSize="small" />
							</Box>
						</ListItemIcon>
						<ListItemText
							primary="Add a stock"
							secondary="Record a buy you made"
							primaryTypographyProps={{ fontWeight: 700 }}
						/>
					</ListItemButton>

					<Typography sx={groupLabelSx}>Import</Typography>
					<ListItemButton
						sx={rowSx}
						onClick={() => {
							onClose();
							navigate("/import");
						}}
					>
						<ListItemIcon sx={{ minWidth: 48, pl: 0.5 }}>
							<RestoreIcon fontSize="small" />
						</ListItemIcon>
						<ListItemText primary="Restore a VittNest backup" secondary="Preview before anything changes" />
					</ListItemButton>

					<Typography sx={groupLabelSx}>Download</Typography>
					{EXPORT_ITEMS.map(({ kind, Icon, primary, secondary }) => (
						<ListItemButton
							key={kind}
							sx={rowSx}
							disabled={Boolean(busy)}
							onClick={async () => {
								await download(kind);
								onClose();
							}}
						>
							<ListItemIcon sx={{ minWidth: 48, pl: 0.5 }}>
								{busy === kind ? <CircularProgress size={18} /> : <Icon fontSize="small" />}
							</ListItemIcon>
							<ListItemText primary={primary} secondary={secondary} />
						</ListItemButton>
					))}
				</List>
			</SwipeableDrawer>
			{toast}
		</>
	);
}
