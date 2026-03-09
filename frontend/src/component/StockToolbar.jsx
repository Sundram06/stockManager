import { Button, TextField, Box, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LogoutIcon from "@mui/icons-material/Logout";
import AddStock from "./AddStock";
import { createStock, logoutUser, queryClient } from "../util/http.mjs";
import { useMutation } from "@tanstack/react-query";
import { addStockToPortfolio } from "../store/stocks-slice";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../store/auth-slice";

export default function StockToolbar() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [isOpen, setIsOpen] = useState(false);

	const handleClickOpen = () => setIsOpen(true);
	const handleClickCloseDialog = () => setIsOpen(false);

	const mutateCall = (data) => mutate(data);

	const { mutate } = useMutation({
		mutationFn: createStock,
		mutationKey: ["stocks"],
		onSuccess: (data) => {
			dispatch(addStockToPortfolio(data));
			queryClient.invalidateQueries("stocks");
			handleClickCloseDialog();
		},
		onError: (error) => {
			throw new Error("Failed to add stock", { cause: error });
		},
	});

	const handleLogout = () => {
		logoutUser();
		sessionStorage.setItem("justLoggedOut", "1"); // Set flag for LoginPage
		dispatch(logout({ sessionActive: "loggedout" }));
		navigate("/login");
	};

	return (
		<>
			<AddStock
				open={isOpen}
				mutateCall={mutateCall}
				handleClickCloseDialog={handleClickCloseDialog}
				nameInputField={true}
			/>
			{/* Outer wrapper with shadow and no margin-bottom */}
			<Box
				sx={{
					boxShadow: 2,
					backgroundColor: 'background.paper',
				}}
			>
				{/* Inner toolbar */}
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						p: 2,
						flexWrap: "wrap",
						gap: 2,
					}}
				>
					<Tooltip title="Search coming soon!">
						<TextField
							variant="outlined"
							size="small"
							type="search"
							name="Search"
							placeholder="Search (Coming Soon)"
							disabled
							sx={{
								minWidth: 250,
							}}
						/>
					</Tooltip>
					<Box display="flex" gap={2}>
						<Button
							variant="contained"
							color="primary"
							startIcon={<AddIcon />}
							onClick={handleClickOpen}
						>
							Add Stock
						</Button>
						<Button
							variant="outlined"
							color="primary"
							startIcon={<LogoutIcon />}
							sx={{
								boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
							}}
							onClick={handleLogout}
						>
							Logout
						</Button>
					</Box>
				</Box>
			</Box>
		</>
	);
}
