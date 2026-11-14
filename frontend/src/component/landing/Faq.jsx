import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LandingSection from "./LandingSection";
import RevealOnScroll from "./RevealOnScroll";
import SectionHeading from "./SectionHeading";
import { FAQS } from "./landingContent";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY } from "./useLandingTokens";

export default function Faq() {
	const { paper, border, textPrimary, textSecondary } = useLandingTokens();

	return (
		<LandingSection alt labelledBy="faq-heading" maxWidth="820px">
			<RevealOnScroll>
				<SectionHeading id="faq-heading" eyebrow="Questions" title="Straight answers." align="center" />
			</RevealOnScroll>
			<RevealOnScroll>
				{FAQS.map(({ question, answer }) => (
					<Accordion
						key={question}
						disableGutters
						elevation={0}
						sx={{ bgcolor: paper, border: `1px solid ${border}`, "&:not(:last-of-type)": { borderBottom: 0 }, "&::before": { display: "none" } }}
					>
						<AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 3, py: 0.5 }}>
							<Typography component="h3" sx={{ fontFamily: FONT_DISPLAY, fontSize: "1.15rem", fontWeight: 600, color: textPrimary }}>
								{question}
							</Typography>
						</AccordionSummary>
						<AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
							<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.95rem", lineHeight: 1.7, color: textSecondary }}>{answer}</Typography>
						</AccordionDetails>
					</Accordion>
				))}
			</RevealOnScroll>
		</LandingSection>
	);
}
