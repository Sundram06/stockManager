import {
	Box,
	Typography,
	Button,
	Container,
	Grid,
	Paper,
	Chip,
	Stack,
	Divider,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

export default function DemoLandingPage() {
	const navigate = useNavigate();

	const productPillars = [
		{
			title: "Position Intelligence",
			description:
				"Track quantity, average buy price, LTP, current value, and realized or unrealized P&L in one focused workspace.",
			icon: <InsightsOutlinedIcon fontSize="small" />,
		},
		{
			title: "Action-Oriented Workflow",
			description:
				"Add, sell, inspect history, and clean up positions with minimal friction and clear operational guardrails.",
			icon: <BoltOutlinedIcon fontSize="small" />,
		},
		{
			title: "Secure Session Layer",
			description:
				"Role-aware auth flow, session hydration, and protected navigation paths designed for dependable daily usage.",
			icon: <SecurityOutlinedIcon fontSize="small" />,
		},
	];

	const workflow = [
		"Onboard with email or OAuth and land directly in your portfolio control center.",
		"Capture buys and sells with date and price metadata for clean historical continuity.",
		"Review active versus dormant positions and evaluate outcomes from one data surface.",
	];

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				minHeight: "calc(100vh - 64px)",
				bgcolor: "background.default",
				position: "relative",
				overflow: "hidden",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: 0,
					pointerEvents: "none",
					background: (theme) =>
						theme.palette.mode === "dark"
							? `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 34%), radial-gradient(circle at 85% 90%, ${alpha(theme.palette.secondary.main, 0.12)} 0%, transparent 34%)`
							: `radial-gradient(circle at 15% 10%, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 34%), radial-gradient(circle at 85% 90%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 34%)`,
				},
			}}
		>
			<Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, flex: 1, position: "relative", zIndex: 1 }}>
				<Paper
					elevation={2}
					sx={{
						p: { xs: 2.5, sm: 3.5, md: 4 },
						borderRadius: "0.5rem",
						border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.9)}`,
						background: (theme) =>
							theme.palette.mode === "dark"
								? `linear-gradient(160deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.elevated, 0.85)} 100%)`
							: `linear-gradient(160deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(theme.palette.background.elevated, 0.82)} 100%)`,
					}}
				>
					<Grid container spacing={{ xs: 2.5, md: 4 }} alignItems="stretch">
						<Grid item xs={12} md={7}>
							<Stack direction="row" spacing={1} sx={{ mb: 1.4, flexWrap: "wrap", rowGap: 1 }}>
								<Chip label="Portfolio OS" color="primary" size="small" />
								<Chip label="Real-time Ready" size="small" variant="outlined" />
								<Chip label="Auth Secured" size="small" variant="outlined" />
							</Stack>

							<Typography variant="h2" fontWeight={700} sx={{ fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" }, mb: 1.4 }}>
								Run Your Portfolio Like a Desk.
							</Typography>

							<Typography variant="h6" color="text.secondary" sx={{ maxWidth: "62ch", lineHeight: 1.55, mb: 2.4 }}>
								VittNest gives you a streamlined operating layer for modern equity management: add and sell execution, clean historical context, and a focused dashboard for decision velocity.
							</Typography>

							<Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} sx={{ mb: 2.5 }}>
								<Button
									variant="contained"
									color="primary"
									size="large"
									onClick={() => navigate("/login")}
									endIcon={<ArrowForwardIcon />}
								>
									Launch Workspace
								</Button>
								<Button
									variant="outlined"
									color="primary"
									size="large"
									onClick={() => navigate("/register")}
								>
									Create Account
								</Button>
							</Stack>

							<Stack spacing={0.9}>
								{workflow.map((step) => (
									<Stack key={step} direction="row" spacing={1} alignItems="flex-start">
										<CheckCircleOutlineIcon sx={{ fontSize: "1rem", mt: "2px", color: "primary.main" }} />
										<Typography variant="body2" color="text.secondary">{step}</Typography>
									</Stack>
								))}
							</Stack>
						</Grid>

						<Grid item xs={12} md={5}>
							<Paper
								variant="outlined"
								sx={{
									p: 2,
									height: "100%",
									borderRadius: "0.9rem",
									borderColor: (theme) => alpha(theme.palette.divider, 0.95),
									backgroundColor: (theme) =>
										theme.palette.mode === "dark"
											? alpha(theme.palette.background.default, 0.45)
											: alpha(theme.palette.background.default, 0.82),
								}}
							>
								<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
									<AccountBalanceWalletOutlinedIcon color="primary" fontSize="small" />
									<Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
										Product Highlights
									</Typography>
								</Stack>

								<Stack spacing={1.3}>
									<Box>
										<Typography variant="h5" sx={{ fontWeight: 700 }}>Unified Stock Ledger</Typography>
										<Typography variant="body2" color="text.secondary">
											Single-source clarity across active and exited positions.
										</Typography>
									</Box>

									<Divider />

									<Box>
										<Typography variant="h5" sx={{ fontWeight: 700 }}>Execution History Panel</Typography>
										<Typography variant="body2" color="text.secondary">
											Inspect transactions, sold quantities, and historical P&L context.
										</Typography>
									</Box>

									<Divider />

									<Box>
										<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
											<TimelineOutlinedIcon color="primary" fontSize="small" />
											<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Built for Daily Review</Typography>
										</Stack>
										<Typography variant="body2" color="text.secondary">
											Fast, table-driven workflow for investors who need disciplined execution loops.
										</Typography>
									</Box>
								</Stack>
							</Paper>
						</Grid>
					</Grid>

					<Box sx={{ mt: 3.2 }}>
						<Grid container spacing={1.5}>
							{productPillars.map((pillar) => (
								<Grid item xs={12} md={4} key={pillar.title}>
									<Paper
										variant="outlined"
										sx={{
											p: 1.7,
											height: "100%",
											borderRadius: "0.9rem",
											borderColor: (theme) => alpha(theme.palette.divider, 0.95),
											backgroundColor: (theme) =>
												theme.palette.mode === "dark"
													? alpha(theme.palette.background.default, 0.45)
													: alpha(theme.palette.background.default, 0.86),
										}}
									>
										<Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.6 }}>
											<Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>{pillar.icon}</Box>
											<Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{pillar.title}</Typography>
										</Stack>
										<Typography variant="body2" color="text.secondary">
											{pillar.description}
										</Typography>
									</Paper>
								</Grid>
							))}
						</Grid>
					</Box>
				</Paper>
			</Container>
			<Box sx={{ mt: "auto", py: 3, bgcolor: "primary.main" }}>
				<Container maxWidth="lg">
					<Typography color="white" align="center" fontSize={16}>
						&copy; {new Date().getFullYear()} VittNest. All rights reserved.
					</Typography>
				</Container>
			</Box>
		</Box>
	);
}
