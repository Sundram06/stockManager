import { useTheme } from "@mui/material/styles";

export const FONT_DISPLAY = '"Newsreader", serif';
export const FONT_BODY = '"Manrope", sans-serif';
export const FONT_UI = '"DM Sans", sans-serif';

/** Colours and surfaces shared by the public pages, for the current light or dark theme. */
export default function useLandingTokens() {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return {
		isDark,
		teal: theme.palette.primary.main,
		paper: theme.palette.background.paper,
		elevated: theme.palette.background.elevated ?? (isDark ? "#1a1a1a" : "#F0F0F5"),
		textPrimary: theme.palette.text.primary,
		textSecondary: theme.palette.text.secondary,
		border: theme.palette.divider,
		gain: isDark ? "#22c55e" : "#16a34a",
		loss: isDark ? "#ef4444" : "#dc2626",
		sectionAlt: isDark ? theme.palette.background.paper : "#FFFFFF",
		glassPanel: {
			background: isDark ? "rgba(26,26,26,0.5)" : "rgba(255,255,255,0.65)",
			backdropFilter: "blur(20px)",
			border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(10,123,123,0.12)"}`,
		},
	};
}
