/* eslint-disable react/prop-types */
import {
	Box,
	Typography,
	Button,
	Tabs,
	Tab,
	TextField,
	InputAdornment,
	Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

export default function PortfolioHeader({
	search,
	onSearchChange,
	tab,
	onTabChange,
	onAddStock,
	username,
	children,
}) {
	return (
		<>
			{/* Title + Add Stock button */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 1,
					mb: 1.5,
					minHeight: { xs: 44, sm: "auto" },
				}}
			>
				<Typography
					variant="h4"
					fontWeight="bold"
					sx={{
						fontSize: { xs: "1.2rem", sm: "1.6rem" },
						lineHeight: 1.15,
					}}
				>
					{username ? `${username}'s Portfolio` : "My Portfolio"}
				</Typography>
				<Button
					variant="contained"
					color="primary"
					onClick={onAddStock}
					startIcon={<AddIcon />}
					sx={{
						display: { xs: "none", sm: "inline-flex" },
						px: 2,
						py: 0.6,
						fontSize: "0.875rem",
						whiteSpace: "nowrap",
					}}
				>
					Add Stock
				</Button>
			</Box>

			<Divider sx={{ mb: 2 }} />

			{children}

			{/* Search */}
			<TextField
				fullWidth
				size="small"
				variant="outlined"
				placeholder="Search for a stock"
				value={search}
				onChange={(e) => onSearchChange(e.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
						</InputAdornment>
					),
				}}
				sx={{
					mb: 2.5,
					"& .MuiOutlinedInput-root": {
						fontSize: { xs: "0.875rem", sm: "1rem" },
						backgroundColor: (theme) => theme.palette.background.elevated,
					},
				}}
			/>

			{/* Tabs */}
			<Tabs
				value={tab}
				onChange={(_, v) => onTabChange(v)}
				sx={{
					mb: 2,
					minHeight: { xs: "40px", sm: "48px" },
					"& .MuiTab-root": {
						fontSize: { xs: "0.8rem", sm: "1rem" },
						px: { xs: 1, sm: 2 },
						minHeight: { xs: "40px", sm: "48px" },
					},
				}}
			>
				<Tab label="Active Stocks" />
				<Tab label="Dormant Stocks" />
			</Tabs>
		</>
	);
}
