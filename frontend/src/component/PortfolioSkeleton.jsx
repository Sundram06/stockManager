import PropTypes from "prop-types";
import {
	Box,
	Paper,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { ACTIVE_COLS, COL_WIDTHS, DORMANT_COLS } from "./stockTableColumns";

const ROWS = 6;

const headerSx = {
	fontWeight: 700,
	fontSize: "0.72rem",
	letterSpacing: "0.06em",
	textTransform: "uppercase",
	color: "text.secondary",
	whiteSpace: "nowrap",
	py: 1.25,
};

function TableSkeleton({ activeTab }) {
	const theme = useTheme();
	const cols = activeTab === 0 ? ACTIVE_COLS : DORMANT_COLS;

	return (
		<Table size="small">
			<TableHead>
				<TableRow>
					{cols.map((c) => (
						<TableCell key={c.id} align={c.align} sx={{ ...headerSx, width: COL_WIDTHS[c.id], borderBottom: `2px solid ${theme.palette.divider}` }}>
							{c.label}
						</TableCell>
					))}
					<TableCell align="center" sx={{ ...headerSx, width: COL_WIDTHS.actions, borderBottom: `2px solid ${theme.palette.divider}` }}>
						Actions
					</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{Array.from({ length: ROWS }, (_, row) => (
					<TableRow key={row}>
						{cols.map((c) => (
							<TableCell key={c.id} align={c.align} sx={{ py: 1.5 }}>
								<Skeleton
									variant="text"
									width={c.id === "name" ? "70%" : "60%"}
									sx={{ ml: c.align === "right" ? "auto" : 0, fontSize: "0.9rem" }}
								/>
							</TableCell>
						))}
						<TableCell align="center">
							<Skeleton variant="rounded" width={56} height={22} sx={{ mx: "auto" }} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

TableSkeleton.propTypes = { activeTab: PropTypes.number.isRequired };

function ListSkeleton() {
	return (
		<Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
			{Array.from({ length: ROWS }, (_, row) => (
				<Box key={row} sx={{ px: 2, py: 1.5, borderBottom: row < ROWS - 1 ? 1 : 0, borderColor: "divider" }}>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Skeleton variant="text" width="30%" sx={{ fontSize: "0.72rem" }} />
						<Skeleton variant="text" width="18%" sx={{ fontSize: "0.72rem" }} />
					</Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Skeleton variant="text" width="40%" sx={{ fontSize: "1rem" }} />
						<Skeleton variant="text" width="25%" sx={{ fontSize: "1rem" }} />
					</Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Skeleton variant="text" width="35%" sx={{ fontSize: "0.72rem" }} />
						<Skeleton variant="text" width="22%" sx={{ fontSize: "0.72rem" }} />
					</Box>
				</Box>
			))}
		</Paper>
	);
}

/**
 * Placeholder in the shape of the holdings view while the first load runs:
 * the table's own columns on desktop, compact rows on mobile.
 */
export default function PortfolioSkeleton({ activeTab = 0 }) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	return (
		<Box role="status" aria-label="Loading your holdings" aria-busy="true">
			{isMobile ? <ListSkeleton /> : <TableSkeleton activeTab={activeTab} />}
		</Box>
	);
}

PortfolioSkeleton.propTypes = { activeTab: PropTypes.number };
