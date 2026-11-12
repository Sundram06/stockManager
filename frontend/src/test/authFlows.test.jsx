import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes, useLocation } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "./render.jsx";

const exchangeGoogleCode = vi.fn();
const loginUser = vi.fn();
vi.mock("../util/api/auth.mjs", () => ({
	exchangeGoogleCode: (...a) => exchangeGoogleCode(...a),
	loginUser: (...a) => loginUser(...a),
}));

const OAuthSuccessPage = (await import("../pages/OAuthSuccessPage")).default;
const LoginPage = (await import("../pages/LoginPage")).default;

const CODE = "a".repeat(64);

function Probe() {
	const location = useLocation();
	return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

const renderOAuth = () =>
	renderWithProviders(
		<Routes>
			<Route path="/oauth-success" element={<OAuthSuccessPage />} />
			<Route path="*" element={<Probe />} />
		</Routes>,
		{ route: "/oauth-success" },
	);

describe("Google sign-in landing page", () => {
	beforeEach(() => {
		localStorage.clear();
		exchangeGoogleCode.mockReset();
	});
	afterEach(() => window.history.replaceState(null, "", "/"));

	it("exchanges the code from the fragment and opens the dashboard", async () => {
		window.history.replaceState(null, "", `/oauth-success#code=${CODE}`);
		exchangeGoogleCode.mockResolvedValueOnce({ user: { _id: "u1", email: "g@example.com" }, token: "session-token" });

		const { store } = renderOAuth();

		expect(await screen.findByTestId("location")).toHaveTextContent("/dashboard");
		expect(exchangeGoogleCode).toHaveBeenCalledWith(CODE);
		expect(localStorage.getItem("token")).toBe("session-token");
		expect(store.getState().auth.user.email).toBe("g@example.com");
	});

	it("does not sign in when the server refuses the code", async () => {
		window.history.replaceState(null, "", `/oauth-success#code=${CODE}`);
		exchangeGoogleCode.mockRejectedValueOnce(new Error("expired"));

		const { store } = renderOAuth();

		expect(await screen.findByTestId("location")).toHaveTextContent("/login?error=google");
		expect(localStorage.getItem("token")).toBeNull();
		expect(store.getState().auth.user).toBeNull();
	});

	it("ignores a token passed in the URL", async () => {
		window.history.replaceState(null, "", "/oauth-success?token=attacker-token");

		renderOAuth();

		expect(await screen.findByTestId("location")).toHaveTextContent("/login?error=google");
		expect(exchangeGoogleCode).not.toHaveBeenCalled();
		expect(localStorage.getItem("token")).toBeNull();
	});
});

describe("login page", () => {
	beforeEach(() => loginUser.mockReset());

	it("shows the server's one answer for bad credentials under the password, with a reset link", async () => {
		const error = Object.assign(new Error("Incorrect email or password."), { code: "INVALID_CREDENTIALS" });
		loginUser.mockRejectedValueOnce(error);
		renderWithProviders(<LoginPage />, { route: "/login" });

		await userEvent.type(screen.getByLabelText(/email/i), "a@example.com");
		await userEvent.type(screen.getByLabelText(/^password/i), "wrong");
		await userEvent.click(screen.getByRole("button", { name: "Sign In" }));

		expect(await screen.findByText("Incorrect email or password.")).toBeInTheDocument();
		expect(screen.getAllByRole("link", { name: /forgot password/i }).length).toBeGreaterThan(0);
	});

	it("offers Google but no longer Upstox sign-in", () => {
		renderWithProviders(<LoginPage />, { route: "/login" });
		expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /upstox/i })).not.toBeInTheDocument();
	});
});
