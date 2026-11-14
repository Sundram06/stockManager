import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen, within } from "./render.jsx";
import { compareMethods } from "../component/landing/fifoMath";
import { FIFO_EXAMPLE } from "../component/landing/landingContent";

const sendContactMessage = vi.fn();
vi.mock("../util/api/contact.mjs", () => ({ sendContactMessage: (...a) => sendContactMessage(...a) }));

const LandingPage = (await import("../pages/LandingPage")).default;
const ContactPage = (await import("../pages/ContactPage")).default;
const PrivacyPage = (await import("../pages/PrivacyPage")).default;

describe("FIFO example", () => {
	it("works out both methods from the example trades", () => {
		const { soldQty, average, fifo } = compareMethods(FIFO_EXAMPLE.trades);

		expect(soldQty).toBe(10);
		expect(average).toEqual({ soldCost: 12500, heldCost: 1250, profit: 3500 });
		expect(fifo).toEqual({ soldCost: 10000, heldCost: 1500, profit: 6000 });
	});
});

describe("landing page", () => {
	it("shows every section with its headline", () => {
		renderWithProviders(<LandingPage />);

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Know what every share really cost you.");
		for (const name of [
			"A spreadsheet average hides what you actually made.",
			"Everything you need to follow your holdings.",
			"Three steps.",
			"You hold the keys.",
			"Straight answers.",
		]) {
			expect(screen.getByRole("heading", { level: 2, name })).toBeInTheDocument();
		}
		expect(screen.getByText("₹6,000")).toBeInTheDocument();
		expect(screen.getByText("₹3,500")).toBeInTheDocument();
	});

	it("makes none of the claims the app cannot back up", () => {
		const { container } = renderWithProviders(<LandingPage />);
		const text = container.textContent;

		for (const claim of [/tax planning/i, /immutable/i, /your bank knows/i, /no delays/i, /sovereign/i, /420\.69/, /₹1\.2M/]) {
			expect(text).not.toMatch(claim);
		}
	});

	it("links the footer to real pages", () => {
		renderWithProviders(<LandingPage />);
		const footer = within(screen.getByRole("contentinfo"));

		expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
		expect(footer.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
		expect(footer.getByRole("link", { name: "Contact" })).toHaveAttribute("href", "/contact");
	});
});

describe("privacy page", () => {
	it("points deletion requests to the contact page", () => {
		renderWithProviders(<PrivacyPage />, { route: "/privacy" });
		const link = screen.getAllByRole("link", { name: "the contact page" })[0];
		expect(link).toHaveAttribute("href", "/contact");
	});
});

describe("contact page", () => {
	beforeEach(() => sendContactMessage.mockReset());

	const fillAndSend = async () => {
		const user = userEvent.setup();
		for (const [label, value] of [
			[/your name/i, "Asha"],
			[/your email/i, "asha@example.com"],
			[/message/i, "How do I import trades?"],
		]) {
			await user.click(screen.getByLabelText(label));
			await user.paste(value);
		}
		await user.click(screen.getByRole("button", { name: /send message/i }));
	};

	it("sends the form and confirms, without showing any address of ours", async () => {
		sendContactMessage.mockResolvedValueOnce({ message: "Thanks, your message has been sent. We'll reply by email." });
		const { container } = renderWithProviders(<ContactPage />, { route: "/contact" });

		await fillAndSend();

		expect(await screen.findByText(/your message has been sent/i)).toBeInTheDocument();
		expect(sendContactMessage.mock.calls[0][0]).toEqual({ name: "Asha", email: "asha@example.com", message: "How do I import trades?", website: "" });
		expect(container.innerHTML).not.toMatch(/mailto:/);
	});

	it("shows the server's error", async () => {
		sendContactMessage.mockRejectedValueOnce(new Error("Too many attempts. Try again in 59 minutes."));
		renderWithProviders(<ContactPage />, { route: "/contact" });

		await fillAndSend();

		expect(await screen.findByText(/too many attempts/i)).toBeInTheDocument();
	});
});
