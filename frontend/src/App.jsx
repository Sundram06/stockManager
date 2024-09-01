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

function App() {
	useEffect(() => {
		const token = localStorage.getItem("token");
		checkTokenExpiry(token);
	}, []);
	const router = createBrowserRouter([
		{
			path: "/",
			element: <RootLayout />,
			children: [
				{ path: "/dashboard", element: <DashboardPage /> },
				{ index: true, element: <LoginPage /> },
				{ path: "register", element: <RegisterPage /> },
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
