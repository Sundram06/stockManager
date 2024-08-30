import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	Avatar,
	Button,
	TextField,
	Grid,
	Box,
	Typography,
	Container,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { login } from "../store/auth-slice";
import { useMutation } from "@tanstack/react-query";
import { loginUser } from "../util/http.mjs";

const theme = createTheme();

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const sessionActive = useSelector((state) => state.auth.sessionActive);
	const logoutMessage = useSelector((state) => state.auth.logoutMessage);
	console.log(sessionActive);

	// const { data } = useQuery({
	// 	queryKey: ["upstox"],
	// 	queryFn: fetchUpstoxData,
	// });

	// if (data) {
	// 	console.log(data);
	// }

	const { mutate } = useMutation({
		mutationKey: ["login"],
		mutationFn: loginUser,
		onSuccess: (data) => {
			console.log("inside loginUser onsuccess", data);
			localStorage.setItem("token", data.token);
			localStorage.setItem("sessionActive", true);
			dispatch(login(data.user));
			navigate("/dashboard");
		},
		onError: (error) => {
			throw new Error("Failed to login, please try again !", {
				cause: error,
			});
		},
	});

	const handleSubmit = async (event) => {
		event.preventDefault();
		const data = new FormData(event.target);
		const userData = Object.fromEntries(data);
		mutate(userData);
	};

	async function handleUpstox() {
		const response = await fetch("http://localhost:3000/api/upstox/login", {
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
		});
		if (!response.ok) {
			console.error("Failed to fetch upstox data");
		}
		const data = await response.json();
		window.open(data, "_blank");
		// navigate("/upstocks");
	}

	return (
		<>
			<ThemeProvider theme={theme}>
				<Container component="main" maxWidth="xs">
					<Box
						sx={{
							marginTop: 8,
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
						}}
					>
						{logoutMessage &&
							sessionActive === "expired" && ( // Display the logout message
								<Typography variant="body2" color="error">
									Session Expired. Please login again.
								</Typography>
							)}
						{logoutMessage &&
							sessionActive === "loggedout" && ( // Display the logout message
								<Typography variant="body2" color="error">
									Logged Out
								</Typography>
							)}
						<Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
							<LockOutlinedIcon />
						</Avatar>
						<Typography component="h1" variant="h5">
							Sign in
						</Typography>
						<Box
							component="form"
							onSubmit={handleSubmit}
							noValidate
							sx={{ mt: 1 }}
						>
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
								sx={{ mt: 3, mb: 2 }}
							>
								Sign In
							</Button>
							<Grid container>
								<Grid item xs>
									<Link
										href="#"
										style={{ textDecoration: "underline", color: "blue" }}
									>
										Forgot password?
									</Link>
								</Grid>
								<Grid item>
									<Link
										to="/register"
										style={{ textDecoration: "underline", color: "blue" }}
									>
										{"Don't have an account? Sign Up"}
									</Link>
								</Grid>
							</Grid>
						</Box>
					</Box>
				</Container>
			</ThemeProvider>
			<div>
				<Button onClick={() => handleUpstox()}>Upstocks</Button>
			</div>
		</>
	);
}
