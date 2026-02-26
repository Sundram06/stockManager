import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { logout } from "../store/auth-slice";
import { logoutUser } from "../util/http.mjs";
import { useNavigate } from "react-router-dom";
import classes from "./Header.module.css";

export default function Header() {
	const user = useSelector((s) => s.auth.user);
	const dispatch = useDispatch();
	const navigate = useNavigate();

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
		<AppBar position="static" className={classes.header} elevation={1}>
			<Toolbar sx={{ justifyContent: "space-between" }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<AssessmentIcon sx={{ fontSize: "1.8rem", color: "#ffffff" }} />
					<Typography
						variant="h6"
						noWrap
						component="div"
						sx={{ fontWeight: "bold", color: "#ffffff" }}
					>
						VittNest
					</Typography>
				</Box>
				{user && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Typography variant="body2" sx={{ color: "#ffffff", mr: 2 }}>
							Welcome, {getFirstName(user) || "User"}!
						</Typography>
						<Button
							variant="outlined"
							startIcon={<LogoutIcon />}
							onClick={handleLogout}
							sx={{
								color: "#ffffff",
								borderColor: "#ffffff",
								"&:hover": {
									borderColor: "#ffffff",
									backgroundColor: "rgba(255, 255, 255, 0.1)",
								},
							}}
						>
							Logout
						</Button>
					</Box>
				)}
			</Toolbar>
		</AppBar>
	);
}
