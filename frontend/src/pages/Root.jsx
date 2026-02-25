import Header from "../component/Header";
import { Outlet, useLocation } from "react-router-dom";
import useHydrateAuth from "../hooks/useHydrateAuth";
import { useSelector } from "react-redux";
import { Box, CircularProgress } from "@mui/material";

export default function RootLayout() {
	useHydrateAuth();
	const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
	const location = useLocation();
	const isLoginOrRegister = [
		"/login",
		"/register",
		"/forgot-password",
	].includes(location.pathname);
	const isDashboard = location.pathname === "/dashboard";

	return (
		<Box
			sx={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#f5f7fa",
			}}
		>
			<Header />
			<Box
				component="main"
				sx={{
					flex: 1,
					backgroundColor: isDashboard ? "#f5f7fa" : "#ffffff",
					display: "flex",
					flexDirection: "column",
				}}
			>
				{isAuthLoading && !isLoginOrRegister ? (
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							flex: 1,
						}}
					>
						<CircularProgress />
					</Box>
				) : (
					<Outlet />
				)}
			</Box>
		</Box>
	);
}
