// DeleteStockModal.jsx
import PropTypes from "prop-types";
import {
	Dialog,
	DialogContent,
	DialogActions,
	Button,
	Box,
	Typography,
	Divider,
} from "@mui/material";

export default function DeleteStockModal({
	open,
	onClose,
	onConfirm,
	stockName,
}) {
	return (
		<Dialog
			open={open}
			onClose={onClose}
			PaperProps={{
				sx: {
					p: 0,
					overflow: "hidden",
					borderRadius: "0.5rem",
				},
			}}
		>
			<Box
				sx={{
					backgroundColor: "primary.main",
					color: "primary.contrastText",
					px: 2,
					py: 1.5,
				}}
			>
				<Typography variant="h6" fontWeight="bold">
					Delete Stock
				</Typography>
			</Box>

			<DialogContent sx={{ p: 3 }}>
				<Typography variant="body1" sx={{ mb: 1 }}>
					Are you sure you want to delete{" "}
					<strong style={{ color: "inherit", fontWeight: 700 }}>{stockName}</strong>?
				</Typography>
				<Typography variant="body2" color="text.secondary">
					<strong>Warning:</strong> Any unsold shares for this stock will also
					be removed.
				</Typography>
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					px: 3,
					pb: 2,
					display: "flex",
					justifyContent: "flex-end",
					gap: 1.5,
				}}
			>
				<Button
					variant="outlined"
					color="primary"
					onClick={onClose}
					sx={{
						minWidth: 80,
					}}
				>
					Cancel
				</Button>
				<Button
					variant="contained"
					color="error"
					onClick={onConfirm}
					sx={{
						minWidth: 80,
					}}
				>
					Delete
				</Button>
			</DialogActions>
		</Dialog>
	);
}

DeleteStockModal.propTypes = {
	open: PropTypes.bool.isRequired,
	onClose: PropTypes.func.isRequired,
	onConfirm: PropTypes.func.isRequired,
	stockName: PropTypes.string.isRequired,
};
