import { Box, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CtaButtons from "./CtaButtons";
import { HERO } from "./landingContent";
import useLandingTokens, { FONT_BODY, FONT_DISPLAY, FONT_UI } from "./useLandingTokens";

const heroAnimations = `
	@keyframes heroFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
	@keyframes heroIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
	.hero-in { animation: heroIn 0.7s ease-out both; }
	@media (prefers-reduced-motion: reduce) {
		.hero-in, .hero-ghost { animation: none !important; }
	}
`;

export default function LandingHero() {
	const { isDark, teal, textPrimary, textSecondary, loss } = useLandingTokens();

	// Decorative only, in the formats Indian investors read: lakh, not million.
	const ghosts = [
		{ text: "+12.4%", color: teal, sx: { top: "18%", left: "7%", fontSize: "clamp(2rem,5vw,3.5rem)" }, delay: "0s" },
		{ text: "₹12.4 L", color: textSecondary, sx: { top: "40%", right: "6%", fontSize: "clamp(2.2rem,6vw,4.5rem)" }, delay: "1s" },
		{ text: "−2.1%", color: loss, sx: { bottom: "20%", left: "14%", fontSize: "clamp(1.5rem,4vw,2.6rem)" }, delay: "2s" },
	];

	return (
		<Box
			component="header"
			sx={{
				// Full height on desktop: anything less shows an empty strip of the next
				// section, whose content only fades in once scrolled to.
				minHeight: { xs: "auto", md: "100vh" },
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "relative",
				overflow: "hidden",
				pt: { xs: "120px", md: "80px" },
				pb: { xs: 10, md: 0 },
			}}
		>
			<style>{heroAnimations}</style>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${isDark ? "rgba(15,179,175,0.10)" : "rgba(10,123,123,0.06)"} 0%, transparent 70%)`,
				}}
			/>
			{ghosts.map(({ text, color, sx, delay }) => (
				<Box
					key={text}
					aria-hidden
					className="hero-ghost"
					sx={{
						position: "absolute",
						display: { xs: "none", sm: "block" },
						pointerEvents: "none",
						userSelect: "none",
						opacity: 0.09,
						fontFamily: FONT_DISPLAY,
						fontStyle: "italic",
						color,
						animation: `heroFloat 10s ease-in-out ${delay} infinite`,
						...sx,
					}}
				>
					{text}
				</Box>
			))}

			<Box sx={{ position: "relative", textAlign: "center", px: { xs: 3, md: 6 }, maxWidth: "920px", mx: "auto" }}>
				<Typography
					component="h1"
					className="hero-in"
					sx={{
						fontFamily: FONT_DISPLAY,
						fontSize: "clamp(2.6rem, 7vw, 5.8rem)",
						fontWeight: 700,
						lineHeight: 1.05,
						letterSpacing: "-0.03em",
						color: textPrimary,
						mb: 4,
					}}
				>
					{HERO.titleStart}{" "}
					<Box component="span" sx={{ color: teal, fontStyle: "italic" }}>
						{HERO.titleAccent}
					</Box>{" "}
					{HERO.titleEnd}
				</Typography>

				<Typography
					className="hero-in"
					sx={{
						fontFamily: FONT_BODY,
						fontSize: { xs: "1rem", md: "1.2rem" },
						color: textSecondary,
						maxWidth: "640px",
						mx: "auto",
						lineHeight: 1.7,
						mb: 5,
						animationDelay: "0.15s",
					}}
				>
					{HERO.subtitle}
				</Typography>

				<Box className="hero-in" sx={{ animationDelay: "0.3s" }}>
					<CtaButtons />
				</Box>

				<Typography
					className="hero-in"
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 1,
						mt: 4,
						fontFamily: FONT_UI,
						fontSize: "0.85rem",
						color: textSecondary,
						animationDelay: "0.45s",
					}}
				>
					<LockOutlinedIcon sx={{ fontSize: "1rem", color: teal }} />
					{HERO.trustLine}
				</Typography>
			</Box>
		</Box>
	);
}
