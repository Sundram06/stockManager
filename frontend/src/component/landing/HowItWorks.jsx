import { Box, Typography } from "@mui/material";
import LandingSection from "./LandingSection";
import RevealOnScroll from "./RevealOnScroll";
import SectionHeading from "./SectionHeading";
import { STEPS } from "./landingContent";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "./useLandingTokens";

export default function HowItWorks() {
	const { teal, textPrimary, textSecondary, border } = useLandingTokens();

	return (
		<LandingSection alt labelledBy="steps-heading">
			<RevealOnScroll>
				<SectionHeading id="steps-heading" eyebrow="How it works" title="Three steps." align="center" />
			</RevealOnScroll>
			<Box component="ol" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: { xs: 5, md: 6 } }}>
				{STEPS.map(({ title, body }, index) => (
					<RevealOnScroll key={title}>
						<Box component="li" sx={{ textAlign: "center", px: 2 }}>
							<Box
								aria-hidden
								sx={{
									width: 48,
									height: 48,
									mx: "auto",
									mb: 2.5,
									borderRadius: "50%",
									border: `1px solid ${border}`,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontFamily: FONT_DISPLAY,
									fontSize: "1.4rem",
									fontWeight: 700,
									color: teal,
								}}
							>
								{index + 1}
							</Box>
							<Typography component="h3" sx={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: "1.4rem", fontWeight: 600, color: textPrimary, mb: 1 }}>
								{title}
							</Typography>
							<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.95rem", lineHeight: 1.7, color: textSecondary, maxWidth: "300px", mx: "auto" }}>{body}</Typography>
						</Box>
					</RevealOnScroll>
				))}
			</Box>
		</LandingSection>
	);
}
