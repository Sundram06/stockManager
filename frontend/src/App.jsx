import "./App.css";
import {
	checkTokenExpiry,
	scheduleTokenExpiryTimer,
	clearTokenExpiryTimer,
} from "./util/http.mjs";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./pages/Root";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./util/http.mjs";
import { useEffect, lazy, Suspense } from "react";

// Add these:
import { useDispatch, useSelector } from "react-redux";
import { login } from "./store/auth-slice";
import { jwtDecode } from "jwt-decode";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const MarketDataFeed = lazy(() => import("./component/Testwebsocket"));
const OAuthSuccessPage = lazy(() => import("./pages/OAuthSuccessPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const DemoLandingPage = lazy(() => import("./pages/DemoLandingPage"));

const renderLazy = (Component, props) => (
	<Suspense fallback={null}>
		<Component {...props} />
	</Suspense>
);

const auth_token =
	"eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4RkFSVlkiLCJqdGkiOiI2NmU1MmFlNTFjMDhhZTA0Y2JmMjY0ZjciLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaWF0IjoxNzI2Mjk0NzU3LCJpc3MiOiJ1ZGFwaS1nYXRld2F5LXNlcnZpY2UiLCJleHAiOjE3MjYzNTEyMDB9.8qdRt3iKwZDPmwCXLRbyNNO1e7mAMt3PdxdrQDdU67U";

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ path: "", element: renderLazy(DemoLandingPage) },
			{ path: "/oauth-success", element: renderLazy(OAuthSuccessPage) },
			{ path: "/dashboard", element: renderLazy(DashboardPage) },
			{ path: "login", element: renderLazy(LoginPage) },
			{ path: "register", element: renderLazy(RegisterPage) },
			{
				path: "/ws",
				element: renderLazy(MarketDataFeed, { token: auth_token }),
			},
			{ path: "/forgot-password", element: renderLazy(ForgotPasswordPage) },
		],
	},
]);

function App() {
	const dispatch = useDispatch();
	const user = useSelector((state) => state.auth.user);
	const token = useSelector((state) => state.auth.token);

	useEffect(() => {
		if (token && !user) {
			try {
				const decoded = jwtDecode(token);
				dispatch(login({ user: { _id: decoded.userId }, token }));
			} catch (e) {
				// Optionally clear token if invalid
				localStorage.removeItem("token");
			}
		}

		if (token && checkTokenExpiry(token)) {
			scheduleTokenExpiryTimer(token);
		} else {
			clearTokenExpiryTimer();
		}

		return () => {
			if (!token) {
				clearTokenExpiryTimer();
			}
		};
	}, [dispatch, user, token]);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
}

export default App;
