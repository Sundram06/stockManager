import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { Box, Button, IconButton, Tooltip, Typography, useMediaQuery } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useTheme as useAppTheme } from "../theme/useTheme";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";

/**
 * Shared public nav used on landing, login, and register pages.
 *
 * Props:
 *  - alwaysGlass: if true, nav starts in glass state immediately (for short auth pages)
 *  - currentPage: "login" | "register" | undefined — used to suppress redundant nav buttons
 */
export default function PublicNav({ alwaysGlass = false, currentPage }) {
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const isLoggedIn = useSelector((s) => !!s.auth.token);

	const { toggleTheme } = useAppTheme();
	const isDark = theme.palette.mode === "dark";
	const teal = theme.palette.primary.main;
	const textPrimary = theme.palette.text.primary;
	const textSecondary = theme.palette.text.secondary;
	const border = theme.palette.divider;

	const [scrolled, setScrolled] = useState(alwaysGlass);

	useEffect(() => {
		if (alwaysGlass) return; // auth pages stay glass always
		const onScroll = () => setScrolled(window.scrollY > 24);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [alwaysGlass]);

	const glassStyle = {
		background: scrolled
			? isDark ? "rgba(17,17,17,0.88)" : "rgba(249,249,251,0.88)"
			: "transparent",
		backdropFilter: scrolled ? "blur(20px)" : "none",
		borderBottom: scrolled ? `1px solid ${border}` : "1px solid transparent",
		transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
	};

	const showSignIn = currentPage !== "login" && !isMobile;
	const showGetStarted = currentPage !== "register";

	return (
		<Box
			component="nav"
			sx={{
				position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
				px: { xs: 3, md: 6 }, py: 2.5,
				display: "flex", alignItems: "center", justifyContent: "space-between",
				...glassStyle,
			}}
		>
			{/* Logo */}
			<Typography
				sx={{
					fontFamily: '"Newsreader", serif',
					fontStyle: "italic",
					fontWeight: 700,
					fontSize: { xs: "1.4rem", md: "1.6rem" },
					color: teal,
					letterSpacing: "-0.01em",
					cursor: "pointer",
				}}
				onClick={() => navigate("/")}
			>
				VittNest
			</Typography>

			{/* Right side */}
			<Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
				{showSignIn && (
					<Button
						onClick={() => navigate("/login")}
						sx={{
							color: textSecondary,
							fontFamily: '"DM Sans", sans-serif',
							fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.06em",
							textTransform: "uppercase",
							"&:hover": { color: textPrimary, background: "transparent" },
						}}
					>
						Sign In
					</Button>
				)}

				<Tooltip title={isDark ? "Light mode" : "Dark mode"}>
					<IconButton
						onClick={toggleTheme}
						size="small"
						sx={{
							color: textSecondary,
							border: `1px solid ${border}`,
							borderRadius: "0.5rem",
							p: "6px",
							"&:hover": { color: textPrimary, borderColor: teal, background: "transparent" },
						}}
					>
						{isDark
							? <LightModeIcon sx={{ fontSize: "1.1rem" }} />
							: <DarkModeIcon sx={{ fontSize: "1.1rem" }} />}
					</IconButton>
				</Tooltip>

				{showGetStarted && (
					<Button
						variant="contained"
						onClick={() => navigate(isLoggedIn ? "/dashboard" : "/register")}
						sx={{
							bgcolor: teal, color: "#fff",
							fontFamily: '"DM Sans", sans-serif',
							fontSize: "0.75rem", fontWeight: 700,
							letterSpacing: "0.08em", textTransform: "uppercase",
							px: { xs: 2.5, md: 3 }, py: 1.1,
							borderRadius: "0.5rem", boxShadow: "none",
							"&:hover": { bgcolor: teal, opacity: 0.88, boxShadow: "none" },
						}}
					>
						{isLoggedIn ? "Dashboard" : "Get Started"}
					</Button>
				)}
			</Box>
		</Box>
	);
}

PublicNav.propTypes = {
	alwaysGlass: PropTypes.bool,
	currentPage: PropTypes.oneOf(["login", "register"]),
};
