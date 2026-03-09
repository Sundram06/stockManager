import {
	AppBar,
	Toolbar,
	Typography,
	Box,
	IconButton,
	Tooltip,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { logout } from "../store/auth-slice";
import { logoutUser } from "../util/http.mjs";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../theme/useTheme";

export default function Header() {
	const user = useSelector((s) => s.auth.user);
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { mode, toggleTheme, theme } = useTheme();

	const getFirstName = (userInfo) => {
		if (!userInfo) return "User";
		if (userInfo.name && userInfo.name.trim()) {
			return userInfo.name.trim().split(/\s+/)[0];
		}
		if (userInfo.email && userInfo.email.includes("@")) {
			return userInfo.email.split("@")[0];
		}
		return "User";
	};

	const handleLogout = () => {
		logoutUser();
		dispatch(logout({ sessionActive: "loggedout" }));
		navigate("/login");
	};

	return (
		<AppBar
			position="static" 
			elevation={1}
			sx={{
				background: 'var(--secondary)',
				color: 'var(--secondary-foreground)',
				boxShadow: theme.shadows[2],
				borderRadius: 0,
			}}
		>
			<Toolbar
				sx={{
					justifyContent: "space-between",
					py: 1,
					px: { xs: 1, sm: 2 },
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: { xs: 0.5, sm: 1 },
					}}
				>
					<AssessmentIcon
						sx={{ fontSize: { xs: "1.4rem", sm: "1.8rem" } }}
					/>
					<Typography
						variant="h6"
						noWrap
						component="div"
						sx={{
							fontWeight: "bold",
							fontSize: { xs: "1rem", sm: "1.25rem" },
						}}
					>
						VittNest
					</Typography>
				</Box>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: { xs: 0.5, sm: 1.5 },
					}}
				>
					{user && (
						<Typography
							variant="body2"
							sx={{
								display: { xs: "none", sm: "block" },
								fontSize: { sm: "0.875rem" },
							}}
						>
							Welcome, {getFirstName(user) || "User"}!
						</Typography>
					)}
					<Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
						<IconButton
							onClick={toggleTheme}
							sx={{
								size: "small",
								"&:hover": {
									backgroundColor: "rgba(255, 255, 255, 0.15)",
								},
							}}
						>
							{mode === 'dark' ? (
								<LightModeIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
							) : (
								<DarkModeIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
							)}
						</IconButton>
					</Tooltip>
					{user && (
						<Tooltip title="Logout">
							<IconButton
								onClick={handleLogout}
								sx={{
									size: "small",
									"&:hover": {
										backgroundColor: "rgba(255, 255, 255, 0.1)",
									},
								}}
							>
								<LogoutIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }} />
							</IconButton>
						</Tooltip>
					)}
				</Box>
			</Toolbar>
		</AppBar>
	);
}
