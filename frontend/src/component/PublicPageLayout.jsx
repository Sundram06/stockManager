import PropTypes from "prop-types";
import { Box } from "@mui/material";
import PublicNav from "./PublicNav";
import SiteFooter from "./SiteFooter";

/** Frame for public content pages: glass nav, a readable column, and the site footer. */
export default function PublicPageLayout({ children, maxWidth = "760px" }) {
	return (
		<Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
			<PublicNav alwaysGlass />
			<Box component="main" sx={{ flex: 1, width: "100%", maxWidth, mx: "auto", px: 3, pt: { xs: "112px", md: "136px" }, pb: 10 }}>
				{children}
			</Box>
			<SiteFooter />
		</Box>
	);
}

PublicPageLayout.propTypes = {
	children: PropTypes.node,
	maxWidth: PropTypes.string,
};
