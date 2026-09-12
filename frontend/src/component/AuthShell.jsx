import { Avatar, Box, Container, Paper, Typography } from "@mui/material";
import PropTypes from "prop-types";
import PublicNav from "./PublicNav";

/**
 * Shared frame for public auth pages: glass nav + centered card.
 * Login and Register render their own card because they carry extra chrome
 * (OAuth buttons, contextual links); the smaller flows use this shell.
 */
export default function AuthShell({ icon, title, children, currentPage }) {
	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
			<PublicNav alwaysGlass currentPage={currentPage} />
			<Container component="main" maxWidth="xs" sx={{ pt: "88px", pb: 6 }}>
				<Paper elevation={3} sx={{ p: 4, mt: 4 }}>
					{icon && (
						<Box display="flex" justifyContent="center" mb={2}>
							<Avatar sx={{ bgcolor: "primary.main" }}>{icon}</Avatar>
						</Box>
					)}
					{title && (
						<Typography
							component="h1"
							variant="h5"
							textAlign="center"
							fontWeight="bold"
							sx={{ mb: 2 }}
						>
							{title}
						</Typography>
					)}
					{children}
				</Paper>
			</Container>
		</Box>
	);
}

AuthShell.propTypes = {
	icon: PropTypes.node,
	title: PropTypes.string,
	children: PropTypes.node.isRequired,
	currentPage: PropTypes.oneOf(["login", "register"]),
};
