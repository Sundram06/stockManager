/* eslint-disable react/prop-types */
import {
	Box,
	Typography,
	Button,
	IconButton,
	Tabs,
	Tab,
	TextField,
	InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

export default function PortfolioHeader({
	search,
	onSearchChange,
	tab,
	onTabChange,
	onAddStock,
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
					mb: 2,
					minHeight: { xs: 44, sm: "auto" },
				}}
			>
				<Typography
					variant="h4"
					fontWeight="bold"
					sx={{
						fontSize: { xs: "1.5rem", sm: "2.125rem" },
						lineHeight: 1.15,
					}}
				>
					My Portfolio
				</Typography>
				<IconButton
					aria-label="add stock"
					onClick={onAddStock}
					sx={{
						display: { xs: "inline-flex", sm: "none" },
						width: 44,
						height: 44,
						borderRadius: 1.5,
						backgroundColor: "primary.main",
						color: "primary.contrastText",
						"&:hover": { backgroundColor: "primary.dark" },
					}}
				>
					<AddIcon />
				</IconButton>
				<Button
					variant="contained"
					color="primary"
					onClick={onAddStock}
					startIcon={<AddIcon />}
					sx={{
						display: { xs: "none", sm: "inline-flex" },
						px: 3,
						py: 1,
						fontSize: "1rem",
						whiteSpace: "nowrap",
					}}
				>
					Add Stock
				</Button>
			</Box>

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
