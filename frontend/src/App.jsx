import {
	checkTokenExpiry,
	scheduleTokenExpiryTimer,
	clearTokenExpiryTimer,
} from "./util/api/session.mjs";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./pages/Root";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./util/api/queryClient.mjs";
import { useEffect, lazy, Suspense } from "react";

import { useDispatch, useSelector } from "react-redux";
import { login } from "./store/auth-slice";
import { jwtDecode } from "jwt-decode";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const OAuthSuccessPage = lazy(() => import("./pages/OAuthSuccessPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));
const DemoLandingPage = lazy(() => import("./pages/DemoLandingPage"));

const renderLazy = (Component, props) => (
	<Suspense fallback={null}>
		<Component {...props} />
	</Suspense>
);

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
			{ path: "/forgot-password", element: renderLazy(ForgotPasswordPage) },
			{ path: "/reset-password", element: renderLazy(ResetPasswordPage) },
			{ path: "/verify-email", element: renderLazy(VerifyEmailPage) },
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
