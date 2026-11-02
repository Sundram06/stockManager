import {
	getTokenStatus,
	expireSession,
	scheduleTokenExpiryTimer,
	clearTokenExpiryTimer,
} from "./util/api/session.mjs";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./pages/Root";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./util/api/queryClient.mjs";
import { useEffect, Suspense } from "react";
import { lazyWithReload } from "./util/lazyWithReload.mjs";

import { useDispatch, useSelector } from "react-redux";
import { login } from "./store/auth-slice";
import { jwtDecode } from "jwt-decode";

const DashboardPage = lazyWithReload(() => import("./pages/DashboardPage"));
const LoginPage = lazyWithReload(() => import("./pages/LoginPage"));
const RegisterPage = lazyWithReload(() => import("./pages/RegisterPage"));
const OAuthSuccessPage = lazyWithReload(() => import("./pages/OAuthSuccessPage"));
const ForgotPasswordPage = lazyWithReload(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazyWithReload(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazyWithReload(() => import("./pages/VerifyEmailPage"));
const DemoLandingPage = lazyWithReload(() => import("./pages/DemoLandingPage"));
const ImportPage = lazyWithReload(() => import("./pages/ImportPage"));

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
			{ path: "/import", element: renderLazy(ImportPage) },
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

		const status = getTokenStatus(token);
		if (status === "valid") {
			scheduleTokenExpiryTimer(token);
		} else {
			clearTokenExpiryTimer();
			// A token we hold but can no longer use ends the session. This used
			// to happen implicitly inside checkTokenExpiry; it is explicit now
			// so that the same check can run on every API call without one.
			if (status !== "missing") expireSession(status);
		}

		return () => {
			if (!token) {
				clearTokenExpiryTimer();
			}
		};
	}, [dispatch, user, token]);

	return (
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} future={{ v7_startTransition: true }} />
		</QueryClientProvider>
	);
}

export default App;
