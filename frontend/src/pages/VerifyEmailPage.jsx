import { useState, useEffect } from "react";
import { Box, Button, Typography, Alert, CircularProgress } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import AuthShell from "../component/AuthShell";
import { API_URL } from "../util/api/config.mjs";

export default function VerifyEmailPage() {
	const [status, setStatus] = useState("loading"); // loading | success | invalid | resend_form
	const [message, setMessage] = useState("");
	const [resendEmail, setResendEmail] = useState("");
	const [resendStatus, setResendStatus] = useState(""); // "" | sending | sent | error
	const [resendError, setResendError] = useState("");
	const navigate = useNavigate();

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const token = params.get("token");
		const email = params.get("email");
		const resend = params.get("resend");

		if (resend === "1") {
			setResendEmail(email || "");
			setStatus("resend_form");
			return;
		}

		if (!token || !email) {
			setStatus("invalid");
			setMessage("Invalid verification link.");
			return;
		}

		fetch(`${API_URL}/api/verify-email`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ token, email }),
		})
			.then((res) => res.json().then((data) => ({ ok: res.ok, data })))
			.then(({ ok, data }) => {
				if (ok) {
					setStatus("success");
				} else if (data.code === "INVALID_TOKEN") {
					setResendEmail(email);
					setStatus("expired");
					setMessage(data.message || "This verification link has expired.");
				} else {
					setStatus("invalid");
					setMessage(data.message || "Verification failed.");
				}
			})
			.catch(() => {
				setStatus("invalid");
				setMessage("Something went wrong. Please try again.");
			});
	}, []);

	const handleResend = async () => {
		setResendStatus("sending");
		setResendError("");
		try {
			const res = await fetch(`${API_URL}/api/resend-verification`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: resendEmail }),
			});
			const data = await res.json();
			if (!res.ok) {
				setResendError(data.message || "Failed to resend. Please try again.");
				setResendStatus("error");
				return;
			}
			setResendStatus("sent");
		} catch {
			setResendError("Failed to resend. Please try again.");
			setResendStatus("error");
		}
	};

	return (
		<AuthShell icon={<MarkEmailReadOutlinedIcon />}>
			{status === "loading" && (
				<Box textAlign="center">
					<CircularProgress sx={{ mb: 2 }} />
					<Typography>Verifying your email…</Typography>
				</Box>
			)}

			{status === "success" && (
				<>
					<Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
						Email verified
					</Typography>
					<Alert severity="success" sx={{ mb: 3 }}>
						Your email has been verified. You can now log in.
					</Alert>
					<Button variant="contained" fullWidth onClick={() => navigate("/login")}>
						Go to Login
					</Button>
				</>
			)}

			{(status === "expired" || status === "invalid") && (
				<>
					<Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
						{status === "expired" ? "Link expired" : "Invalid link"}
					</Typography>
					<Alert severity="error" sx={{ mb: 3 }}>
						{message}
					</Alert>
					{status === "expired" && (
						resendStatus === "sent" ? (
							<Alert severity="success">
								A new verification link has been sent to <strong>{resendEmail}</strong>.
							</Alert>
						) : (
							<>
								{resendError && <Alert severity="error" sx={{ mb: 2 }}>{resendError}</Alert>}
								<Button
									variant="contained"
									fullWidth
									disabled={resendStatus === "sending"}
									onClick={handleResend}
								>
									{resendStatus === "sending" ? "Sending…" : "Resend verification email"}
								</Button>
							</>
						)
					)}
					<Box mt={2} textAlign="center">
						<Link to="/login" style={{ color: "inherit", fontSize: "0.9rem", opacity: 0.8 }}>
							Back to Login
						</Link>
					</Box>
				</>
			)}

			{status === "resend_form" && (
				<>
					<Typography variant="h5" fontWeight="bold" textAlign="center" gutterBottom>
						Resend verification
					</Typography>
					{resendStatus === "sent" ? (
						<Alert severity="success">
							A new verification link has been sent to <strong>{resendEmail}</strong>.
						</Alert>
					) : (
						<>
							<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
								We'll send a new verification link to <strong>{resendEmail}</strong>.
							</Typography>
							{resendError && <Alert severity="error" sx={{ mb: 2 }}>{resendError}</Alert>}
							<Button
								variant="contained"
								fullWidth
								disabled={resendStatus === "sending"}
								onClick={handleResend}
							>
								{resendStatus === "sending" ? "Sending…" : "Send new link"}
							</Button>
						</>
					)}
					<Box mt={2} textAlign="center">
						<Link to="/login" style={{ color: "inherit", fontSize: "0.9rem", opacity: 0.8 }}>
							Back to Login
						</Link>
					</Box>
				</>
			)}
		</AuthShell>
	);
}
