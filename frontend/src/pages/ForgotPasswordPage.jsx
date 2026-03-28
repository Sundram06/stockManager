import { useState, useEffect } from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	Paper,
	Alert,
} from "@mui/material";
import { API_URL } from "../util/api/config.mjs";

export default function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		// If email is passed as a query param, prefill it
		const params = new URLSearchParams(window.location.search);
		const emailParam = params.get("email");
		if (emailParam) setEmail(emailParam);
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSubmitted(false);
		if (!email) {
			setError("Please enter your email address.");
			return;
		}
		try {
			const res = await fetch(`${API_URL}/api/forgot-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			if (!res.ok) throw new Error("Failed to send reset email");
			setSubmitted(true);
		} catch (err) {
			setError("Failed to send reset email. Please try again later.");
		}
	};

	return (
		<Box>
			<Paper
				elevation={3}
				sx={{ p: 4, mt: 6, borderRadius: 3 }}
			>
				<Typography
					variant="h5"
					fontWeight="bold"
					textAlign="center"
					gutterBottom
				>
					Forgot Password
				</Typography>
				{submitted ? (
					<Alert severity="success" sx={{ mb: 2 }}>
						If an account with that email exists, a password reset link has been
						sent.
					</Alert>
				) : (
					<form onSubmit={handleSubmit}>
						<TextField
							label="Email"
							type="email"
							fullWidth
							required
							margin="normal"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						<Button
							type="submit"
							variant="contained"
							color="primary"
							fullWidth
							sx={{ mt: 2 }}
						>
							Send Reset Link
						</Button>
					</form>
				)}
			</Paper>
		</Box>
	);
}
