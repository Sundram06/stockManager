import { Box, Typography } from "@mui/material";
import LandingSection from "./LandingSection";
import RevealOnScroll from "./RevealOnScroll";
import SectionHeading from "./SectionHeading";
import { FEATURES } from "./landingContent";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "./useLandingTokens";

export default function FeatureGrid() {
	const { teal, paper, border, textPrimary, textSecondary } = useLandingTokens();

	return (
		<LandingSection labelledBy="features-heading">
			<RevealOnScroll>
				<SectionHeading id="features-heading" eyebrow="What it does" title="Everything you need to follow your holdings." />
			</RevealOnScroll>
			<Box
				sx={{
					display: "grid",
					gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
					gap: 3,
				}}
			>
				{FEATURES.map(({ icon: Icon, title, body }) => (
					<RevealOnScroll key={title}>
						<Box
							component="article"
							sx={{
								height: "100%",
								p: { xs: 3, md: 4 },
								bgcolor: paper,
								border: `1px solid ${border}`,
								borderRadius: "1rem",
								transition: "transform 0.25s ease",
								"@media (hover: hover)": { "&:hover": { transform: "translateY(-4px)" } },
							}}
						>
							<Icon sx={{ color: teal, fontSize: "1.9rem", mb: 2 }} />
							<Typography component="h3" sx={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: "1.5rem", fontWeight: 600, color: textPrimary, mb: 1 }}>
								{title}
							</Typography>
							<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.95rem", lineHeight: 1.7, color: textSecondary }}>{body}</Typography>
						</Box>
					</RevealOnScroll>
				))}
			</Box>
		</LandingSection>
	);
}
