import { Box } from "@mui/material";
import PublicNav from "../component/PublicNav";
import SiteFooter from "../component/SiteFooter";
import LandingHero from "../component/landing/LandingHero";
import FifoExample from "../component/landing/FifoExample";
import FeatureGrid from "../component/landing/FeatureGrid";
import HowItWorks from "../component/landing/HowItWorks";
import DataPromise from "../component/landing/DataPromise";
import Faq from "../component/landing/Faq";
import FinalCta from "../component/landing/FinalCta";

// Copy lives in component/landing/landingContent.js.
export default function LandingPage() {
	return (
		<Box sx={{ bgcolor: "background.default", minHeight: "100vh", overflowX: "clip" }}>
			<PublicNav />
			<LandingHero />
			<Box component="main">
				<FifoExample />
				<FeatureGrid />
				<HowItWorks />
				<DataPromise />
				<Faq />
				<FinalCta />
			</Box>
			<SiteFooter />
		</Box>
	);
}
