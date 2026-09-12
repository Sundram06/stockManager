import { useState, useEffect } from "react";
import { Box, Button, TextField, Alert } from "@mui/material";
import { Link } from "react-router-dom";
import LockResetOutlinedIcon from "@mui/icons-material/LockResetOutlined";
import AuthShell from "../component/AuthShell";
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
			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to send reset email. Please try again later.");
				return;
			}
			setSubmitted(true);
		} catch {
			setError("Failed to send reset email. Please try again later.");
		}
	};

	return (
		<AuthShell icon={<LockResetOutlinedIcon />} title="Forgot Password">
			{submitted ? (
				<Alert severity="success" sx={{ mb: 2 }}>
					If an account with that email exists, a password reset link has been sent.
				</Alert>
			) : (
				<Box component="form" onSubmit={handleSubmit}>
					<TextField
						label="Email"
						type="email"
						fullWidth
						required
						autoFocus
						margin="normal"
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					{error && (
						<Alert severity="error" sx={{ mt: 1, mb: 1 }}>
							{error}
						</Alert>
					)}
					<Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
						Send Reset Link
					</Button>
				</Box>
			)}
			<Box mt={2} textAlign="center">
				<Link to="/login" style={{ color: "inherit", fontSize: "0.9rem", opacity: 0.8 }}>
					Back to Login
				</Link>
			</Box>
		</AuthShell>
	);
}
