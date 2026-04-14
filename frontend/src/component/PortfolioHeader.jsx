/* eslint-disable react/prop-types */
import {
	Box,
	Button,
	TextField,
	InputAdornment,
	useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

// ─── Pill toggle (Active / Dormant) ─────────────────────────────────────────
function SegmentedToggle({ value, onChange }) {
	const theme = useTheme();
	const options = [
		{ label: "Active", val: 0 },
		{ label: "Dormant", val: 1 },
	];

	return (
		<Box
			sx={{
				display: "flex",
				bgcolor: "background.paper",
				border: `1px solid ${theme.palette.divider}`,
				borderRadius: "20px",
				p: "3px",
				gap: "2px",
				flexShrink: 0,
			}}
		>
			{options.map(({ label, val }) => (
				<Button
					key={val}
					onClick={() => onChange(val)}
					size="small"
					disableRipple={false}
					sx={{
						px: { xs: 1.5, sm: 2 },
						py: 0.45,
						borderRadius: "16px",
						fontSize: { xs: "0.75rem", sm: "0.8rem" },
						fontWeight: 600,
						textTransform: "none",
						minWidth: "unset",
						lineHeight: 1.4,
						bgcolor: value === val ? "primary.main" : "transparent",
						color: value === val ? "#fff" : "text.secondary",
						boxShadow: "none",
						transition: "background-color 0.18s ease, color 0.18s ease",
						"&:hover": {
							bgcolor:
								value === val
									? "primary.main"
									: theme.palette.action.hover,
							boxShadow: "none",
						},
					}}
				>
					{label}
				</Button>
			))}
		</Box>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function PortfolioHeader({
	search,
	onSearchChange,
	tab,
	onTabChange,
	onAddStock,
}) {
	return (
		<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: { xs: 1, sm: 1.5 },
					px: { xs: 1.5, sm: 2 },
					py: { xs: 1, sm: 1.5 },
					flexWrap: { xs: "wrap", sm: "nowrap" },
					borderBottom: 1,
					borderColor: "divider",
				}}
			>
				{/* Pill toggle */}
				<SegmentedToggle value={tab} onChange={onTabChange} />

				{/* Search — grows to fill space */}
				<TextField
					size="small"
					variant="outlined"
					placeholder="Search holdings..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon
									sx={{ fontSize: "1.1rem", color: "text.secondary" }}
								/>
							</InputAdornment>
						),
					}}
					sx={{
						flex: 1,
						minWidth: { xs: "100%", sm: 0 },
						order: { xs: 3, sm: 0 },
						"& .MuiOutlinedInput-root": {
							bgcolor: "background.paper",
							fontSize: { xs: "0.85rem", sm: "0.9rem" },
						},
					}}
				/>

				{/* Add Stock — desktop only (mobile uses FAB) */}
				<Button
					variant="contained"
					color="primary"
					onClick={onAddStock}
					startIcon={<AddIcon sx={{ fontSize: "1rem !important" }} />}
					sx={{
						display: { xs: "none", sm: "inline-flex" },
						px: 2.5,
						py: 0.75,
						fontSize: "0.8rem",
						fontWeight: 700,
						letterSpacing: "0.04em",
						whiteSpace: "nowrap",
						flexShrink: 0,
						boxShadow: "none",
						"&:hover": { boxShadow: "none", filter: "brightness(0.9)" },
					}}
				>
					Add Stock
				</Button>
			</Box>
	);
}
