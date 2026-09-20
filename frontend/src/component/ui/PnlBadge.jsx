import { Box, Typography, useTheme } from "@mui/material";
import PropTypes from "prop-types";
import { percent, signedRupee, toneColor } from "../../util/format.mjs";

/** Profit or loss with its percentage, tinted green, red or grey. */
export default function PnlBadge({ value, pct, decimals = 0 }) {
	const theme = useTheme();
	const accent = toneColor(value, theme);
	const pctText = percent(pct);

	return (
		<Box
			sx={{
				display: "inline-flex",
				flexDirection: "column",
				alignItems: "flex-end",
				bgcolor: `${accent}18`,
				borderRadius: "6px",
				px: 1,
				py: 0.4,
				minWidth: 80,
			}}
		>
			<Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: accent, lineHeight: 1.3 }}>
				{signedRupee(value, { decimals })}
			</Typography>
			{pctText && (
				<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: accent, lineHeight: 1.2 }}>
					{pctText}
				</Typography>
			)}
		</Box>
	);
}

PnlBadge.propTypes = {
	value: PropTypes.number,
	pct: PropTypes.number,
	decimals: PropTypes.number,
};
