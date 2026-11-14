import { Box, Typography } from "@mui/material";
import CtaButtons from "./CtaButtons";
import LandingSection from "./LandingSection";
import RevealOnScroll from "./RevealOnScroll";
import { FINAL_CTA } from "./landingContent";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "./useLandingTokens";

export default function FinalCta() {
	const { teal, textPrimary, textSecondary, glassPanel } = useLandingTokens();

	return (
		<LandingSection labelledBy="cta-heading" maxWidth="760px">
			<RevealOnScroll>
				<Box sx={{ ...glassPanel, borderRadius: "1.25rem", textAlign: "center", px: { xs: 3, md: 8 }, py: { xs: 6, md: 8 } }}>
					<Typography
						component="h2"
						id="cta-heading"
						sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 700, lineHeight: 1.15, color: textPrimary, mb: 2 }}
					>
						{FINAL_CTA.title}{" "}
						<Box component="span" sx={{ color: teal, fontStyle: "italic" }}>
							{FINAL_CTA.accent}
						</Box>
					</Typography>
					<Typography sx={{ fontFamily: FONT_BODY, fontSize: "1rem", lineHeight: 1.7, color: textSecondary, mb: 4 }}>{FINAL_CTA.body}</Typography>
					<CtaButtons showSignIn={false} />
				</Box>
			</RevealOnScroll>
		</LandingSection>
	);
}
