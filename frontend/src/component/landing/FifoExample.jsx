import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import LandingSection from "./LandingSection";
import RevealOnScroll from "./RevealOnScroll";
import SectionHeading from "./SectionHeading";
import { FIFO_EXAMPLE } from "./landingContent";
import { compareMethods } from "./fifoMath";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY, FONT_UI } from "./useLandingTokens";

const rupees = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

function ResultCard({ label, soldQty, soldCost, profit, heldCost, highlight }) {
	const { teal, gain, textPrimary, textSecondary, border, paper } = useLandingTokens();
	const rows = [
		[`Cost of the ${soldQty} sold`, rupees(soldCost)],
		["Cost per share still held", rupees(heldCost)],
	];

	return (
		<Box
			sx={{
				flex: 1,
				minWidth: 0,
				p: 3,
				borderRadius: "0.75rem",
				bgcolor: paper,
				border: `1px solid ${highlight ? teal : border}`,
			}}
		>
			<Typography sx={{ fontFamily: FONT_UI, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: highlight ? teal : textSecondary }}>
				{label}
			</Typography>
			<Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: "2.2rem", fontWeight: 700, color: highlight ? gain : textPrimary, my: 1 }}>
				{rupees(profit)}
			</Typography>
			<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.85rem", color: textSecondary, mb: 2 }}>profit on the sale</Typography>
			{rows.map(([name, value]) => (
				<Box key={name} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.75, borderTop: `1px solid ${border}` }}>
					<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.85rem", color: textSecondary }}>{name}</Typography>
					<Typography sx={{ fontFamily: FONT_UI, fontSize: "0.85rem", fontWeight: 700, color: textPrimary }}>{value}</Typography>
				</Box>
			))}
		</Box>
	);
}

ResultCard.propTypes = {
	label: PropTypes.string.isRequired,
	soldQty: PropTypes.number.isRequired,
	soldCost: PropTypes.number.isRequired,
	profit: PropTypes.number.isRequired,
	heldCost: PropTypes.number.isRequired,
	highlight: PropTypes.bool,
};

export default function FifoExample() {
	const { textPrimary, textSecondary, border, glassPanel, gain, loss } = useLandingTokens();
	const { trades } = FIFO_EXAMPLE;
	const { soldQty, average, fifo } = compareMethods(trades);

	return (
		<LandingSection alt labelledBy="fifo-heading">
			<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "5fr 7fr" }, gap: { xs: 4, md: 10 }, alignItems: "start" }}>
				<RevealOnScroll>
					<SectionHeading
						id="fifo-heading"
						eyebrow="Why FIFO"
						title="A spreadsheet average hides what you actually made."
						intro="An average works until you sell part of a holding. Then the question is which shares you sold, and the average can't answer it. FIFO counts the oldest shares as sold first, so the profit you booked and the cost of what you still hold are both real numbers."
					/>
				</RevealOnScroll>

				<RevealOnScroll>
					<Box sx={{ ...glassPanel, borderRadius: "1rem", p: { xs: 2.5, md: 4 } }}>
						<Typography sx={{ fontFamily: FONT_UI, fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: textSecondary, mb: 2 }}>
							Example: one stock, three trades
						</Typography>
						{trades.map(({ side, when, quantity, price }) => (
							<Box key={`${side}-${when}`} sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1, borderBottom: `1px solid ${border}` }}>
								<Typography sx={{ fontFamily: FONT_BODY, fontSize: "0.95rem", color: textPrimary }}>
									<Box component="span" sx={{ fontWeight: 700, color: side === "Buy" ? gain : loss }}>{side}</Box> in {when}
								</Typography>
								<Typography sx={{ fontFamily: FONT_UI, fontSize: "0.95rem", fontWeight: 700, color: textPrimary, whiteSpace: "nowrap" }}>
									{quantity} @ {rupees(price)}
								</Typography>
							</Box>
						))}
						<Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mt: 3 }}>
							<ResultCard label="Simple average" soldQty={soldQty} {...average} />
							<ResultCard label="FIFO" soldQty={soldQty} {...fifo} highlight />
						</Box>
					</Box>
				</RevealOnScroll>
			</Box>
		</LandingSection>
	);
}
