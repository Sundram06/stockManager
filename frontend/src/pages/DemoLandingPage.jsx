import { Box, Typography, Button, Container, Grid, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function DemoLandingPage() {
	const navigate = useNavigate();

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				minHeight: "calc(100vh - 64px)",
				bgcolor: "#f5f7fa",
			}}
		>
			<Container maxWidth="md" sx={{ py: 6, flex: 1 }}>
				<Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
					<Typography
						variant="h3"
						fontWeight={700}
						gutterBottom
						color="primary"
					>
						Welcome to VittNest
					</Typography>
					<Typography variant="h6" color="text.secondary" gutterBottom>
						Your modern solution for tracking, analyzing, and managing your
						stock portfolio with ease.
					</Typography>
					<Grid container spacing={4} sx={{ mt: 2 }}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle1" fontWeight={600} gutterBottom>
								Key Features:
							</Typography>
							<ul style={{ marginLeft: 20, color: "#333", fontSize: "1.1rem" }}>
								<li>Modern, table-based dashboard inspired by Google Stitch</li>
								<li>Easy add, sell, history, and delete actions for stocks</li>
								<li>Professional UI with Material-UI components</li>
								<li>Secure authentication and session management</li>
							</ul>
						</Grid>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle1" fontWeight={600} gutterBottom>
								Get Started:
							</Typography>
							<Button
								variant="contained"
								color="primary"
								size="large"
								sx={{ mt: 2, width: "100%" }}
								onClick={() => navigate("/login")}
							>
								Login / Register
							</Button>
						</Grid>
					</Grid>
				</Paper>
			</Container>
			<Box sx={{ mt: "auto", py: 3, bgcolor: "#1976d2" }}>
				<Container maxWidth="lg">
					<Typography color="white" align="center" fontSize={16}>
						&copy; {new Date().getFullYear()} VittNest. All rights reserved.
					</Typography>
				</Container>
			</Box>
		</Box>
	);
}
