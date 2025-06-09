import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
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
import { login } from "../store/auth-slice";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../util/http.mjs";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const sessionActive = useSelector((state) => state.auth.sessionActive);
	const logoutMessage = useSelector((state) => state.auth.logoutMessage);

	const { mutate } = useMutation({
		mutationKey: ["login"],
		mutationFn: loginUser,
		onSuccess: (data) => {
			localStorage.setItem("token", data.token);
			localStorage.setItem("sessionActive", true);
			dispatch(login(data.user));
			navigate("/dashboard");
		},
		onError: (error) => {
			console.error("Login failed:", error);
			alert("Login failed, please try again.");
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
						borderRadius: 3,
						backgroundColor: "#ffffff",
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
						<Avatar sx={{ bgcolor: "#1976d2" }}>
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
							onChange={(e) => setEmail(e.target.value)}
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
							onChange={(e) => setPassword(e.target.value)}
						/>
						<Button
							type="submit"
							fullWidth
							variant="contained"
							sx={{ mt: 3, backgroundColor: "#1976d2" }}
						>
							Sign In
						</Button>
						<Box display="flex" justifyContent="space-between" mt={2}>
							<Link
								to="#"
								style={{
									textDecoration: "underline",
									color: "#1976d2",
									fontSize: "0.9rem",
								}}
							>
								Forgot password?
							</Link>
							<Link
								to="/register"
								style={{
									textDecoration: "underline",
									color: "#1976d2",
									fontSize: "0.9rem",
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
