// RegistrationForm.jsx
import { useState } from "react";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/auth-slice";
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
import { useMutation } from "@tanstack/react-query";
import { addUser } from "../util/http.mjs";

const RegistrationForm = () => {
	const [error, setError] = useState("");
	const dispatch = useDispatch();
	const navigate = useNavigate();

	const { mutate } = useMutation({
		mutationKey: ["register"],
		mutationFn: addUser,
		onSuccess: (data) => {
			console.log("inside addUser onsuccess", data);
			dispatch(setAuth({ user: data.user }));
			navigate("/");
		},
	});

	const handleSubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.target);
		const data = Object.fromEntries(formData);
		console.log(data);
		const password = data.password;
		const confirmPassword = data.confirmPassword;
		const email = data.email;

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
				"Password must be at least 8 characters long and include at least one special character"
			);
			return;
		}

		mutate(data);
		e.target.reset();
	};

	return (
		<Grid
			container
			justifyContent="center"
			alignItems="center"
			style={{ minHeight: "70vh" }}
		>
			<Grid item xs={12} sm={8} md={4}>
				<Paper elevation={4} style={{ padding: "2rem", borderRadius: "10px" }}>
					<Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
						<Typography
							variant="h4"
							component="h1"
							textAlign="center"
							gutterBottom
						>
							Register
						</Typography>
						{error && (
							<Alert severity="error" sx={{ mb: 2 }}>
								{error}
							</Alert>
						)}
						<TextField
							label="Name"
							name="name"
							required
							fullWidth
							margin="normal"
							variant="outlined"
						/>
						<TextField
							label="Email"
							type="email"
							name="email"
							required
							fullWidth
							margin="normal"
							variant="outlined"
						/>
						<TextField
							label="Password"
							type="password"
							name="password"
							required
							fullWidth
							margin="normal"
							variant="outlined"
						/>
						<TextField
							label="Confirm Password"
							type="password"
							required
							fullWidth
							name="confirmPassword"
							margin="normal"
							variant="outlined"
						/>
						<Button
							type="submit"
							variant="contained"
							color="primary"
							fullWidth
							sx={{ mt: 2, py: 1.5, fontSize: "1rem" }}
						>
							Register
						</Button>
						<Grid container>
							<Grid item style={{ marginTop: "1rem" }}>
								<Link
									to="/login"
									style={{
										textDecoration: "underline",
										color: "blue",
									}}
								>
									{"Already have an account? Login"}
								</Link>
							</Grid>
						</Grid>
					</Box>
				</Paper>
			</Grid>
		</Grid>
	);
};

export default RegistrationForm;
