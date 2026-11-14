import { Box, Typography } from "@mui/material";
import LandingSection from "./LandingSection";
import RevealOnScroll from "./RevealOnScroll";
import SectionHeading from "./SectionHeading";
import { DATA_POINTS } from "./landingContent";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "./useLandingTokens";

export default function DataPromise() {
	const { teal, textPrimary, textSecondary } = useLandingTokens();

	return (
		<LandingSection labelledBy="data-heading">
			<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" }, gap: { xs: 2, md: 10 } }}>
				<RevealOnScroll>
					<SectionHeading id="data-heading" eyebrow="Your data" title="You hold the keys." />
				</RevealOnScroll>
				<Box sx={{ display: "grid", gap: 4 }}>
					{DATA_POINTS.map(({ title, body }) => (
						<RevealOnScroll key={title}>
							<Box sx={{ borderLeft: `2px solid ${teal}`, pl: 3 }}>
								<Typography component="h3" sx={{ fontFamily: FONT_DISPLAY, fontSize: "1.35rem", fontWeight: 600, color: textPrimary, mb: 0.75 }}>
									{title}
								</Typography>
								<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.95rem", lineHeight: 1.7, color: textSecondary }}>{body}</Typography>
							</Box>
						</RevealOnScroll>
					))}
				</Box>
			</Box>
		</LandingSection>
	);
}
