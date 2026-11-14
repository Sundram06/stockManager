import PropTypes from "prop-types";
import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Typography } from "@mui/material";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY, FONT_UI } from "../landing/useLandingTokens";

/** Renders a policy from data: sections of paragraphs and bullet lists. "/contact" in text becomes a link. */
export default function LegalDocument({ title, updated, intro, sections }) {
	const { teal, textPrimary, textSecondary } = useLandingTokens();
	const bodySx = { fontFamily: FONT_BODY, fontSize: "1rem", lineHeight: 1.75, color: textSecondary };

	const withContactLink = (text) =>
		text.split(/(the contact page)/).map((part, i) =>
			part === "the contact page" ? (
				<Link key={i} component={RouterLink} to="/contact" sx={{ color: teal }}>
					the contact page
				</Link>
			) : (
				part
			),
		);

	return (
		<Box component="article">
			<Typography component="h1" sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: "2.4rem", md: "3.2rem" }, fontWeight: 700, color: textPrimary, lineHeight: 1.1 }}>
				{title}
			</Typography>
			<Typography sx={{ fontFamily: FONT_UI, fontSize: "0.8rem", color: textSecondary, mt: 1.5, mb: 4 }}>Last updated {updated}</Typography>
			<Typography sx={{ ...bodySx, mb: 5 }}>{withContactLink(intro)}</Typography>

			{sections.map(({ heading, paragraphs = [], items = [] }) => (
				<Box component="section" key={heading} sx={{ mb: 5 }}>
					<Typography component="h2" sx={{ fontFamily: FONT_DISPLAY, fontSize: "1.6rem", fontWeight: 600, color: textPrimary, mb: 1.5 }}>
						{heading}
					</Typography>
					{paragraphs.map((text) => (
						<Typography key={text} sx={{ ...bodySx, mb: 1.5 }}>
							{withContactLink(text)}
						</Typography>
					))}
					{items.length > 0 && (
						<Box component="ul" sx={{ pl: 3, m: 0 }}>
							{items.map((text) => (
								<Typography component="li" key={text} sx={{ ...bodySx, mb: 0.75 }}>
									{withContactLink(text)}
								</Typography>
							))}
						</Box>
					)}
				</Box>
			))}
		</Box>
	);
}

LegalDocument.propTypes = {
	title: PropTypes.string.isRequired,
	updated: PropTypes.string.isRequired,
	intro: PropTypes.string.isRequired,
	sections: PropTypes.arrayOf(
		PropTypes.shape({
			heading: PropTypes.string.isRequired,
			paragraphs: PropTypes.arrayOf(PropTypes.string),
			items: PropTypes.arrayOf(PropTypes.string),
		}),
	).isRequired,
};
