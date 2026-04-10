import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	Alert,
	Avatar,
	Button,
	TextField,
	Box,
	Typography,
	Container,
	Paper,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { login, clearLogoutMessage } from "../store/auth-slice";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../util/api/auth.mjs";

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [emailError, setEmailError] = useState("");
	const [passwordError, setPasswordError] = useState("");
	const [alertError, setAlertError] = useState({ message: "", code: "" });
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const sessionActive = useSelector((state) => state.auth.sessionActive);
	const logoutMessage = useSelector((state) => state.auth.logoutMessage);

	useEffect(() => {
		// Only clear the logout message if it was already shown once
		if (logoutMessage) {
			// Use a sessionStorage flag to track if we just landed here from logout/session expiry
			const justLoggedOut = sessionStorage.getItem("justLoggedOut");
			if (justLoggedOut) {
				sessionStorage.removeItem("justLoggedOut");
			} else {
				dispatch(clearLogoutMessage());
			}
		}
	}, [dispatch, logoutMessage]);

	const clearErrors = () => {
		setEmailError("");
		setPasswordError("");
		setAlertError({ message: "", code: "" });
	};

	const { mutate } = useMutation({
		mutationKey: ["login"],
		mutationFn: loginUser,
		onSuccess: (data) => {
			clearErrors();
			localStorage.setItem("token", data.token);
			localStorage.setItem("sessionActive", true);
			dispatch(login(data.user));
			navigate("/dashboard");
		},
		onError: (error) => {
			const code = error.code || "";
			const message = error.message || "Login failed, please try again.";
			setEmailError("");
			setPasswordError("");
			setAlertError({ message: "", code: "" });

			if (code === "USER_NOT_FOUND") {
				setEmailError(message);
			} else if (code === "WRONG_PASSWORD") {
				setPasswordError(message);
			} else {
				setAlertError({ message, code });
			}
		},
	});

	const handleSubmit = (event) => {
		event.preventDefault();
		const data = new FormData(event.target);
		mutate(Object.fromEntries(data));
	};

	return (
		<Box>
			<Container component="main" maxWidth="xs">
				<Paper
					elevation={3}
					sx={{
						p: 4,
						mt: 6,
					}}
				>
					{logoutMessage && (
						<Typography
							variant="body2"
							color="error"
							sx={{ mb: 2, textAlign: "center" }}
						>
							{sessionActive === "expired"
								? "Session Expired. Please login again."
								: "Logged Out"}
						</Typography>
					)}
					<Box display="flex" justifyContent="center" mb={2}>
						<Avatar sx={{ bgcolor: 'primary.main' }}>
							<LockOutlinedIcon />
						</Avatar>
					</Box>
					<Typography
						component="h1"
						variant="h5"
						textAlign="center"
						fontWeight="bold"
						sx={{ mb: 2 }}
					>
						Sign In
					</Typography>
					{alertError.message && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{alertError.message}
							{alertError.code === "EMAIL_NOT_VERIFIED" && email && (
								<>
									{" "}
									<Link
										to={`/verify-email?resend=1&email=${encodeURIComponent(email)}`}
										style={{ color: "inherit", fontWeight: "bold" }}
									>
										Resend verification email
									</Link>
								</>
							)}
						</Alert>
					)}
					<Box component="form" onSubmit={handleSubmit}>
						<TextField
							margin="normal"
							required
							fullWidth
							id="email"
							label="Email"
							name="email"
							autoComplete="email"
							autoFocus
							value={email}
							error={!!emailError}
							helperText={
								emailError ? (
									<>
										{emailError}{" "}
										<Link
											to="/register"
											style={{ color: "inherit", fontWeight: "bold" }}
										>
											Create an account?
										</Link>
									</>
								) : null
							}
							onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
						/>
						<TextField
							margin="normal"
							required
							fullWidth
							name="password"
							label="Password"
							type="password"
							id="password"
							autoComplete="current-password"
							value={password}
							error={!!passwordError}
							helperText={
								passwordError ? (
									<>
										{passwordError}{" "}
										<Link
											to={`/forgot-password?email=${encodeURIComponent(email)}`}
											style={{ color: "inherit", fontWeight: "bold" }}
										>
											Forgot password?
										</Link>
									</>
								) : null
							}
							onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
						/>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							color="primary"
							sx={{ mt: 3 }}
						>
							Sign In
						</Button>

						{/* --- OAUTH BUTTONS START HERE --- */}
						<Box display="flex" flexDirection="column" mt={3} gap={1}>
							<Button
								fullWidth
								variant="outlined"
								color="primary"
								onClick={() => {
									window.location.href = `${API_URL}/api/auth/google`;
								}}
							>
								Continue with Google
							</Button>
							<Button
								fullWidth
								variant="outlined"
								color="secondary"
								onClick={() => {
									window.location.href = `${API_URL}/api/upstox/login`;
								}}
							>
								Continue with Upstox
							</Button>
						</Box>
						{/* --- OAUTH BUTTONS END HERE --- */}

						<Box display="flex" justifyContent="space-between" mt={2}>
							<Link
								to={
									email
										? "/forgot-password?email=" + encodeURIComponent(email)
										: "/forgot-password"
								}
								style={{
									color: 'inherit',
									textDecoration: "underline",
									fontSize: "0.9rem",
									opacity: 0.8,
								}}
							>
								Forgot password?
							</Link>
							<Link
								to="/register"
								style={{
									color: 'inherit',
									textDecoration: "underline",
									fontSize: "0.9rem",
									opacity: 0.8,
								}}
							>
								Don&apos;t have an account? Sign Up
							</Link>
						</Box>
					</Box>
				</Paper>
			</Container>
		</Box>
	);
}

//google auth and dev prod url
