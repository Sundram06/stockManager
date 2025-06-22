import { useSelector } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PortfolioCards from "../component/PortfolioCards";
import StockToolbar from "../component/StockToolbar";

export default function DashboardPage() {
	const user = useSelector((s) => s.auth.user);
	const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
	const navigate = useNavigate();

	useEffect(() => {
		if (!isAuthLoading && !user) {
			navigate("/login", { replace: true });
		}
	}, [user, isAuthLoading, navigate]);

	if (isAuthLoading) {
		return <div>Loading...</div>; // You can use a fancy spinner here!
	}

	if (!user) {
		return <div>Redirecting to login...</div>;
	}

	return (
		<>
			<StockToolbar />
			<PortfolioCards />
		</>
	);
}
