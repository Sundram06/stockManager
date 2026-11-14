import PropTypes from "prop-types";
import { Box } from "@mui/material";
import useLandingTokens from "./useLandingTokens";

/** Full-width band with the landing page's spacing; `alt` uses the contrasting background. */
export default function LandingSection({ children, alt = false, labelledBy, maxWidth = "1200px" }) {
	const { sectionAlt } = useLandingTokens();

	return (
		<Box
			component="section"
			aria-labelledby={labelledBy}
			sx={{
				py: { xs: 10, md: 16 },
				px: { xs: 3, md: 8 },
				bgcolor: alt ? sectionAlt : "background.default",
			}}
		>
			<Box sx={{ maxWidth, mx: "auto" }}>{children}</Box>
		</Box>
	);
}

LandingSection.propTypes = {
	children: PropTypes.node,
	alt: PropTypes.bool,
	labelledBy: PropTypes.string,
	maxWidth: PropTypes.string,
};
