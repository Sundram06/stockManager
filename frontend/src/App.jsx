import "./App.css";
import { checkTokenExpiry } from "./util/http.mjs";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./pages/Root";
import DashboardPage from "./pages/DashboardPage";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./util/http.mjs";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useEffect } from "react";
import MarketDataFeed from "./component/Testwebsocket";
import OAuthSuccessPage from "./pages/OAuthSuccessPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DemoLandingPage from "./pages/DemoLandingPage";

// Add these:
import { useDispatch, useSelector } from "react-redux";
import { login } from "./store/auth-slice";
import { jwtDecode } from "jwt-decode";

function App() {
	const dispatch = useDispatch();
	const user = useSelector((state) => state.auth.user);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token && !user) {
			try {
				const decoded = jwtDecode(token);
				dispatch(login({ user: { _id: decoded.userId }, token }));
			} catch (e) {
				// Optionally clear token if invalid
				localStorage.removeItem("token");
			}
		}
		checkTokenExpiry(token);
	}, [dispatch, user]);

	const auth_token =
		"eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4RkFSVlkiLCJqdGkiOiI2NmU1MmFlNTFjMDhhZTA0Y2JmMjY0ZjciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaWF0IjoxNzI2Mjk0NzU3LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3MjYzNTEyMDB9.8qdRt3iKwZDPmwCXLRbyNNO1e7mAMt3PdxdrQDdU67U";
	const router = createBrowserRouter([
		{
			path: "/",
			element: <RootLayout />,
			children: [
				{ path: "", element: <DemoLandingPage /> },
				{ path: "/oauth-success", element: <OAuthSuccessPage /> },
				{ path: "/dashboard", element: <DashboardPage /> },
				{ path: "login", element: <LoginPage /> },
				{ path: "register", element: <RegisterPage /> },
				{ path: "/ws", element: <MarketDataFeed token={auth_token} /> },
				{ path: "/forgot-password", element: <ForgotPasswordPage /> },
			],
		},
	]);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}

export default App;
