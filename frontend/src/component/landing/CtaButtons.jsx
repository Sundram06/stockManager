import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import useLandingTokens, { FONT_UI } from "./useLandingTokens";

const buttonText = {
	fontFamily: FONT_UI,
	fontSize: "0.8rem",
	fontWeight: 700,
	letterSpacing: "0.1em",
	textTransform: "uppercase",
	px: 5,
	py: 1.8,
	borderRadius: "0.5rem",
};

/** "Get started free" and, optionally, "Sign in". */
export default function CtaButtons({ showSignIn = true }) {
	const navigate = useNavigate();
	const { teal, textPrimary, glassPanel } = useLandingTokens();

	return (
		<Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
			<Button
				variant="contained"
				onClick={() => navigate("/register")}
				sx={{
					...buttonText,
					bgcolor: teal,
					color: "#fff",
					boxShadow: "none",
					"&:hover": { bgcolor: teal, filter: "brightness(0.88)", boxShadow: "none" },
				}}
			>
				Get started free
			</Button>
			{showSignIn && (
				<Button
					onClick={() => navigate("/login")}
					sx={{
						...buttonText,
						...glassPanel,
						color: textPrimary,
						"&:hover": { filter: "brightness(0.94)", background: glassPanel.background },
					}}
				>
					Sign in
				</Button>
			)}
		</Box>
	);
}

CtaButtons.propTypes = {
	showSignIn: PropTypes.bool,
};
