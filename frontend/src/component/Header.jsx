import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import classes from "./Header.module.css";

export default function Header() {
	return (
		<AppBar position="static" className={classes.header} elevation={1}>
			<Toolbar sx={{ justifyContent: "space-between" }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<AssessmentIcon sx={{ fontSize: "1.8rem", color: "#ffffff" }} />
					<Typography
						variant="h6"
						noWrap
						component="div"
						sx={{ fontWeight: "bold", color: "#ffffff" }}
					>
						Stock Manager
					</Typography>
				</Box>
			</Toolbar>
		</AppBar>
	);
}
