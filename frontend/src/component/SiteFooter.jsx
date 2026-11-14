import { Link as RouterLink } from "react-router-dom";
import { Box, Link, Typography } from "@mui/material";
import useLandingTokens, { FONT_DISPLAY, FONT_UI } from "./landing/useLandingTokens";

const LINKS = [
	{ label: "Privacy", to: "/privacy" },
	{ label: "Terms", to: "/terms" },
	{ label: "Contact", to: "/contact" },
];

/** Footer for the public pages: landing, legal and contact. */
export default function SiteFooter() {
	const { teal, border, textSecondary } = useLandingTokens();
	const linkSx = {
		fontFamily: FONT_UI,
		fontSize: "0.75rem",
		fontWeight: 600,
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		color: textSecondary,
		textDecoration: "none",
		"&:hover": { color: teal },
	};

	return (
		<Box
			component="footer"
			sx={{
				borderTop: `1px solid ${border}`,
				px: { xs: 3, md: 8 },
				py: 5,
				display: "flex",
				flexDirection: { xs: "column", md: "row" },
				alignItems: "center",
				justifyContent: "space-between",
				gap: 3,
			}}
		>
			<Link component={RouterLink} to="/" underline="none" sx={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 700, fontSize: "1.3rem", color: teal }}>
				VittNest
			</Link>
			<Box component="nav" aria-label="Site" sx={{ display: "flex", gap: 4 }}>
				{LINKS.map(({ label, to }) => (
					<Link key={to} component={RouterLink} to={to} sx={linkSx}>
						{label}
					</Link>
				))}
			</Box>
			<Typography sx={{ fontFamily: FONT_UI, fontSize: "0.75rem", letterSpacing: "0.06em", color: textSecondary }}>
				© {new Date().getFullYear()} VittNest
			</Typography>
		</Box>
	);
}
