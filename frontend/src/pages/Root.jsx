import Header from "../component/Header";
import { Outlet, useLocation } from "react-router-dom";
import useHydrateAuth from "../hooks/useHydrateAuth";
import { useSelector } from "react-redux";

export default function RootLayout() {
	useHydrateAuth();
	const isAuthLoading = useSelector((s) => s.auth.isAuthLoading);
	const location = useLocation();
	const isLoginOrRegister = ["/login", "/register"].includes(location.pathname);
	return (
		<>
			<Header />
			<main>
				{isAuthLoading && !isLoginOrRegister ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							height: "100vh",
						}}
					>
						Loading...
					</div>
				) : (
					<Outlet />
				)}
			</main>
		</>
	);
}
