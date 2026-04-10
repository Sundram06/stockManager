import { useState, useEffect } from "react";
import {
	Box,
	Button,
	TextField,
	Typography,
	Paper,
	Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../util/api/config.mjs";

export default function ResetPasswordPage() {
	const [email, setEmail] = useState("");
	const [token, setToken] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const emailParam = params.get("email");
		const tokenParam = params.get("token");
		if (emailParam) setEmail(emailParam);
		if (tokenParam) setToken(tokenParam);
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			const res = await fetch(`${API_URL}/api/reset-password`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, token, newPassword }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to reset password. The link may have expired.");
				return;
			}
			setSuccess(true);
			setTimeout(() => navigate("/login"), 3000);
		} catch {
			setError("Failed to reset password. Please try again later.");
		}
	};

	return (
		<Box>
			<Paper elevation={3} sx={{ p: 4, mt: 6, borderRadius: 3 }}>
				<Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
					Reset Password
				</Typography>
				{success ? (
					<Alert severity="success">
						Password reset successfully. Redirecting to login…
					</Alert>
				) : (
					<form onSubmit={handleSubmit}>
						<TextField
							label="New Password"
							type="password"
							fullWidth
							required
							margin="normal"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							inputProps={{ minLength: 6 }}
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
							Reset Password
						</Button>
					</form>
				)}
			</Paper>
		</Box>
	);
}
