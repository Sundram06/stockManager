import { useSelector } from "react-redux";
import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioTable from "../component/PortfolioTable";
import {
	Box,
	Typography,
	Button,
	Tabs,
	Tab,
	TextField,
	InputAdornment,
	CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

export default function DashboardPage() {
	const user = useSelector((s) => s.auth.user);
	const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
	const navigate = useNavigate();

	const [tab, setTab] = useState(0);
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		if (!isAuthLoading && !user) {
			navigate("/login", { replace: true });
		}
	}, [user, isAuthLoading, navigate]);

	if (isAuthLoading) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					flexDirection: "column",
					gap: 2,
				}}
			>
				<CircularProgress />
				<Typography variant="h6" color="text.secondary">
					Loading your portfolio...
				</Typography>
			</Box>
		);
	}

	if (!user) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	const handleAddStock = () => {
		setAddOpen(true);
	};

	return (
		<Box
			sx={{
				mx: "auto",
				py: { xs: 2, sm: 4 },
				px: { xs: 1.5, sm: 2 },
				width: "100%",
			}}
		>
			{/* Heading and Add Stock */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 1,
					mb: 2,
					flexWrap: { xs: "wrap", sm: "nowrap" },
				}}
			>
				<Typography
					variant="h4"
					fontWeight="bold"
					sx={{
						fontSize: { xs: "1.5rem", sm: "2.125rem" },
						flex: { xs: "1 1 100%", sm: "auto" },
					}}
				>
					My Portfolio
				</Typography>
				<Button
					variant="contained"
					color="primary"
					onClick={handleAddStock}
					startIcon={<AddIcon />}
					sx={{
						px: { xs: 1, sm: 3 },
						py: { xs: 0.75, sm: 1 },
						fontSize: { xs: "0.75rem", sm: "1rem" },
						minWidth: { xs: "44px", sm: "auto" },
						whiteSpace: "nowrap",
					}}
				>
					<Box sx={{ display: { xs: "none", sm: "block" } }}>Add Stock</Box>
				</Button>
			</Box>

			{/* Search Bar */}
			<TextField
				fullWidth
				size="small"
				variant="outlined"
				placeholder="Search for a stock"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
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
						backgroundColor: (theme) => theme.palette.mode === 'dark' 
							? theme.palette.background.elevated 
						: theme.palette.background.elevated,
				},
			}}
		/>

		{/* Tabs for Active/Dormant */}
		<Tabs
			value={tab}
			onChange={(_, v) => setTab(v)}
			sx={{
				mb: 2,
				minHeight: { xs: "40px", sm: "48px" },
				"& .MuiTab-root": {
					fontSize: { xs: "0.8rem", sm: "1rem" },
					px: { xs: 1, sm: 2 },					minHeight: { xs: "40px", sm: "48px" },
				},
			}}			>
				<Tab label="Active Stocks" />
				<Tab label="Dormant Stocks" />
			</Tabs>

			{/* Table List */}
			<PortfolioTable
				activeTab={tab}
				search={deferredSearch}
				addOpen={addOpen}
				setAddOpen={setAddOpen}
			/>
		</Box>
	);
}
