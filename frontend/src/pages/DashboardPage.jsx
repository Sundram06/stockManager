import { useSelector } from "react-redux";
import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioTable from "../component/PortfolioTable";
import PortfolioHeader from "../component/PortfolioHeader";
import { Box, Typography, CircularProgress } from "@mui/material";

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
			<PortfolioHeader
				search={search}
				onSearchChange={setSearch}
				tab={tab}
				onTabChange={setTab}
				onAddStock={handleAddStock}
			/>
			<PortfolioTable
				activeTab={tab}
				search={deferredSearch}
				addOpen={addOpen}
				setAddOpen={setAddOpen}
			/>
		</Box>
	);
}
