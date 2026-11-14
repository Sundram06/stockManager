import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY, FONT_UI } from "./useLandingTokens";

/** Eyebrow, headline and optional intro used at the top of each landing section. */
export default function SectionHeading({ eyebrow, title, intro, align = "left", id }) {
	const { teal, textPrimary, textSecondary } = useLandingTokens();
	const centred = align === "center";

	return (
		<Box sx={{ textAlign: align, maxWidth: centred ? "720px" : "none", mx: centred ? "auto" : 0, mb: { xs: 5, md: 7 } }}>
			{eyebrow && (
				<Typography
					sx={{
						fontFamily: FONT_UI,
						fontSize: "0.72rem",
						fontWeight: 700,
						letterSpacing: "0.14em",
						textTransform: "uppercase",
						color: teal,
						mb: 1.5,
					}}
				>
					{eyebrow}
				</Typography>
			)}
			<Typography
				component="h2"
				id={id}
				sx={{
					fontFamily: FONT_DISPLAY,
					fontSize: { xs: "2rem", md: "3rem" },
					fontWeight: 700,
					lineHeight: 1.15,
					letterSpacing: "-0.02em",
					color: textPrimary,
				}}
			>
				{title}
			</Typography>
			{intro && (
				<Typography
					sx={{
						fontFamily: FONT_BODY,
						fontSize: { xs: "1rem", md: "1.1rem" },
						lineHeight: 1.7,
						color: textSecondary,
						mt: 2,
						maxWidth: "640px",
						mx: centred ? "auto" : 0,
					}}
				>
					{intro}
				</Typography>
			)}
		</Box>
	);
}

SectionHeading.propTypes = {
	eyebrow: PropTypes.string,
	title: PropTypes.node.isRequired,
	intro: PropTypes.node,
	align: PropTypes.oneOf(["left", "center"]),
	id: PropTypes.string,
};
