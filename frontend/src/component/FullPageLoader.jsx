import PropTypes from "prop-types";
import { Box, CircularProgress, Typography } from "@mui/material";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "./landing/useLandingTokens";

/** Centred wordmark, spinner and message, for the moments before a page has anything to show. */
export default function FullPageLoader({ title, detail }) {
	const { teal, textPrimary, textSecondary } = useLandingTokens();

	return (
		<Box
			role="status"
			aria-live="polite"
			sx={{
				minHeight: "100vh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 3,
				px: 3,
				textAlign: "center",
				bgcolor: "background.default",
			}}
		>
			<Typography sx={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "2.2rem", color: teal }}>VittNest</Typography>
			<CircularProgress size={32} thickness={4} />
			<Box>
				<Typography sx={{ fontFamily: FONT_BODY, fontSize: "1.05rem", fontWeight: 600, color: textPrimary }}>{title}</Typography>
				{detail && <Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.9rem", color: textSecondary, mt: 0.5 }}>{detail}</Typography>}
			</Box>
		</Box>
	);
}

FullPageLoader.propTypes = {
	title: PropTypes.string.isRequired,
	detail: PropTypes.string,
};
