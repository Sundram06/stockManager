import { useState, useEffect } from "react";
import { Box, Button, TextField, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import PasswordOutlinedIcon from "@mui/icons-material/PasswordOutlined";
import AuthShell from "../component/AuthShell";
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

	const linkValid = Boolean(email && token);

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
		<AuthShell icon={<PasswordOutlinedIcon />} title="Reset Password">
			{success ? (
				<Alert severity="success">Password reset successfully. Redirecting to login…</Alert>
			) : !linkValid ? (
				<>
					<Alert severity="error" sx={{ mb: 2 }}>
						This reset link is missing or incomplete. Request a new one.
					</Alert>
					<Button variant="contained" fullWidth onClick={() => navigate("/forgot-password")}>
						Request new link
					</Button>
				</>
			) : (
				<Box component="form" onSubmit={handleSubmit}>
					<TextField
						label="New Password"
						type="password"
						fullWidth
						required
						autoFocus
						margin="normal"
						autoComplete="new-password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						inputProps={{ minLength: 6 }}
						helperText="At least 6 characters"
					/>
					{error && (
						<Alert severity="error" sx={{ mt: 1, mb: 1 }}>
							{error}
						</Alert>
					)}
					<Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
						Reset Password
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
