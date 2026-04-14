import { useSelector } from "react-redux";
import { useDeferredValue, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioTable from "../component/PortfolioTable";
import PortfolioHeader from "../component/PortfolioHeader";
import PortfolioSummary from "../component/PortfolioSummary";
import useMarketData from "../hooks/useMarketData";
import { Box, Typography, CircularProgress, Fab, useTheme, useMediaQuery, useScrollTrigger, Paper } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export default function DashboardPage() {
	const user = useSelector((s) => s.auth.user);
	const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
	const navigate = useNavigate();

	const [tab, setTab] = useState(0);
	const [search, setSearch] = useState("");
	const deferredSearch = useDeferredValue(search);
	const [addOpen, setAddOpen] = useState(false);
	const { ltpMap, isConnected } = useMarketData();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 60 });

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
				py: { xs: 2, sm: 3 },
				px: { xs: 1.5, sm: 2.5 },
				width: "100%",
			}}
		>
			{/* ── Page heading ─────────────────────────────── */}
			<Typography
				variant="h4"
				fontWeight={700}
				sx={{
					fontSize: { xs: "1.2rem", sm: "1.6rem" },
					lineHeight: 1.15,
					mb: { xs: 1.5, sm: 2 },
				}}
			>
				{user?.name?.trim().split(/\s+/)[0]
					? `${user.name.trim().split(/\s+/)[0]}'s Portfolio`
					: "My Portfolio"}
			</Typography>

			{/* ── Summary strip ────────────────────────────── */}
			<PortfolioSummary ltpMap={ltpMap} />

			{/* ── Card: toolbar + table ────────────────────── */}
			<Paper
				elevation={0}
				sx={{
					bgcolor: "background.paper",
					border: 1,
					borderColor: "divider",
					borderRadius: 2,
					overflow: "hidden",
					mb: 4,
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
					ltpMap={ltpMap}
					isConnected={isConnected}
				/>
			</Paper>

			{isMobile && (
				<Fab
					color="primary"
					aria-label="add stock"
					onClick={handleAddStock}
					variant="extended"
					sx={{
						position: "fixed",
						bottom: 24,
						right: 20,
						boxShadow: 6,
						fontWeight: 700,
						fontSize: "0.875rem",
						zIndex: 1200,
						minWidth: "unset",
						width: scrolled ? 56 : "auto",
						height: 56,
						borderRadius: scrolled ? "50%" : "28px",
						px: scrolled ? 0 : 2,
						transition: [
							"width 0.4s cubic-bezier(0.4,0,0.2,1)",
							"border-radius 0.4s cubic-bezier(0.4,0,0.2,1)",
							"padding 0.4s cubic-bezier(0.4,0,0.2,1)",
						].join(", "),
						overflow: "hidden",
					}}
				>
					<AddIcon sx={{ fontSize: "1.1rem", flexShrink: 0 }} />
					<Box
						component="span"
						sx={{
							maxWidth: scrolled ? 0 : 100,
							opacity: scrolled ? 0 : 1,
							overflow: "hidden",
							whiteSpace: "nowrap",
							ml: scrolled ? 0 : 0.75,
							transition: [
								"max-width 0.4s cubic-bezier(0.4,0,0.2,1)",
								"opacity 0.25s ease",
								"margin 0.4s cubic-bezier(0.4,0,0.2,1)",
							].join(", "),
						}}
					>
						Add Stock
					</Box>
				</Fab>
			)}
		</Box>
	);
}
