import { useState } from "react";
import {
	TextField,
	Button,
	Typography,
	Box,
	Alert,
	Grid,
	Paper,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import PublicNav from "../component/PublicNav";
import { useMutation } from "@tanstack/react-query";
import { addUser } from "../util/api/auth.mjs";

const RegistrationForm = () => {
	const [error, setError] = useState("");
	const [registeredEmail, setRegisteredEmail] = useState("");
	const navigate = useNavigate();

	const { mutate } = useMutation({
		mutationKey: ["register"],
		mutationFn: addUser,
		onSuccess: (data, variables) => {
			setRegisteredEmail(variables.email);
		},
		onError: (err) => {
			setError(err.message || "Registration failed. Please try again.");
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData);
		const { password, confirmPassword, email } = data;

		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const passwordPattern = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		if (!emailPattern.test(email)) {
			setError("Invalid email format");
			return;
		}
		if (!passwordPattern.test(password)) {
			setError(
				"Password must be at least 8 characters and include one special character"
			);
			return;
		}

		mutate(data);
		e.target.reset();
	};

	if (registeredEmail) {
		return (
			<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
				<PublicNav alwaysGlass currentPage="register" />
				<Grid container justifyContent="center" alignItems="center" sx={{ minHeight: "100vh", pt: "72px" }}>
					<Grid item xs={12} sm={8} md={4}>
						<Paper elevation={3} sx={{ p: 4 }}>
							<Typography variant="h5" textAlign="center" fontWeight="bold" gutterBottom>
								Check your email
							</Typography>
							<Alert severity="success" sx={{ mb: 2 }}>
								We sent a verification link to <strong>{registeredEmail}</strong>. Click it to activate your account.
							</Alert>
							<Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
								Didn't receive it? Check your spam folder or{" "}
								<Link
									to={`/verify-email?resend=1&email=${encodeURIComponent(registeredEmail)}`}
									style={{ color: "inherit", textDecoration: "underline" }}
								>
									request a new link
								</Link>
								.
							</Typography>
							<Button variant="outlined" fullWidth onClick={() => navigate("/login")}>
								Go to Login
							</Button>
						</Paper>
					</Grid>
				</Grid>
			</Box>
		);
	}

	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
			<PublicNav alwaysGlass currentPage="register" />
			<Grid
				container
				justifyContent="center"
				alignItems="center"
				sx={{ minHeight: "100vh", pt: "72px" }}
			>
				<Grid item xs={12} sm={8} md={4}>
					<Paper
						elevation={3}
						sx={{
							p: 4,
						}}
					>
						<Typography
							variant="h5"
							textAlign="center"
							fontWeight="bold"
							gutterBottom
						>
							Register
						</Typography>
						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						<Box component="form" onSubmit={handleSubmit}>
							<TextField
								label="Name"
								name="name"
								required
								fullWidth
								margin="normal"
							/>
							<TextField
								label="Email"
								name="email"
								type="email"
								required
								fullWidth
								margin="normal"
							/>
							<TextField
								label="Password"
								name="password"
								type="password"
								required
								fullWidth
								margin="normal"
							/>
							<TextField
								label="Confirm Password"
								name="confirmPassword"
								type="password"
								required
								fullWidth
								margin="normal"
							/>
							<Button
								type="submit"
								variant="contained"
								color="primary"
								fullWidth
								sx={{ mt: 3 }}
							>
								Register
							</Button>
							<Box mt={2} textAlign="center">
								<Link
									to="/"
									style={{
										textDecoration: "underline",
										color: "inherit",
										fontSize: "0.9rem",
										opacity: 0.8,
									}}
								>
									Already have an account? Login
								</Link>
							</Box>
						</Box>
					</Paper>
				</Grid>
			</Grid>
		</Box>
	);
};

export default RegistrationForm;
