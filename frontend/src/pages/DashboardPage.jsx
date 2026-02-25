import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
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
		<Box sx={{ mx: "auto", py: 4, px: 2, width: "100%" }}>
			{/* Heading and Add Stock */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 2,
				}}
			>
				<Typography variant="h4" fontWeight="bold">
					My Portfolio
				</Typography>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					sx={{
						borderRadius: 2,
						fontWeight: "bold",
						bgcolor: "#1976d2",
						color: "#fff",
						px: 3,
						boxShadow: "none",
						"&:hover": { bgcolor: "#1565c0" },
					}}
					onClick={handleAddStock}
				>
					Add Stock
				</Button>
			</Box>

			{/* Search Bar */}
			<TextField
				fullWidth
				variant="outlined"
				placeholder="Search for a stock"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon />
						</InputAdornment>
					),
				}}
				sx={{ mb: 3, background: "#f7f8fa", borderRadius: 2 }}
			/>

			{/* Tabs for Active/Dormant */}
			<Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
				<Tab label="Active Stocks" />
				<Tab label="Dormant Stocks" />
			</Tabs>

			{/* Table List */}
			<PortfolioTable
				activeTab={tab}
				search={search}
				addOpen={addOpen}
				setAddOpen={setAddOpen}
			/>
		</Box>
	);
}
