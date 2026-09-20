/* eslint-disable react-refresh/only-export-components */
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { ThemeProvider } from "../theme/ThemeContext";
import authSlice from "../store/auth-slice";

// Renders a component with everything the app provides: a fresh store and
// query cache per test, the theme, and a router.
export function renderWithProviders(ui, { route = "/", preloadedState, client } = {}) {
	const store = configureStore({ reducer: { auth: authSlice.reducer }, preloadedState });
	const queryClient =
		client ??
		new QueryClient({
			defaultOptions: { queries: { retry: false, gcTime: 0 } },
		});

	return {
		store,
		queryClient,
		...render(
			<Provider store={store}>
				<QueryClientProvider client={queryClient}>
					<ThemeProvider>
						<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
					</ThemeProvider>
				</QueryClientProvider>
			</Provider>,
		),
	};
}

/** A signed-in user, as auth-slice stores one. */
export const signedIn = (user = { _id: "u1", name: "Test User" }) => ({
	auth: { user, token: "test-token", isAuthLoading: false, sessionActive: "active", logoutMessage: null },
});

export * from "@testing-library/react";
