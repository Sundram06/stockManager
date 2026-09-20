import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, signedIn, within } from "./render.jsx";

const fetchStocks = vi.fn();
const fetchStockHistoryById = vi.fn();

vi.mock("../util/api/stocks.mjs", () => ({
	fetchStocks: (...a) => fetchStocks(...a),
	createStock: vi.fn(),
	deleteStock: vi.fn(),
	deleteAllStocks: vi.fn(),
	fetchUpstoxData: vi.fn(),
}));

vi.mock("../util/api/history.mjs", () => ({
	fetchStockHistoryById: (...a) => fetchStockHistoryById(...a),
	handleAddStockRowInHistory: vi.fn(),
	handleSellStockRowInHistory: vi.fn(),
}));

// No WebSocket in jsdom, so stand in for the hook the provider uses.
vi.mock("../hooks/useMarketData", () => ({
	default: () => ({ ltpMap: { INFY: { ltp: 1600, cp: 1580 } }, isConnected: true }),
}));

const DashboardPage = (await import("../pages/DashboardPage")).default;

const stock = { _id: "s1", stockName: "INFY", quantity: 10, avgPrice: 1500, totalCostOfStock: 15000 };
const lot = { _id: "h1", stockId: "s1", quantity: 10, avgPrice: 1500, date: "2025-01-06T00:00:00.000Z", quantitySold: 0 };

beforeEach(() => {
	vi.clearAllMocks();
	fetchStocks.mockResolvedValue([stock]);
	fetchStockHistoryById.mockResolvedValue([lot]);
});

describe("dashboard", () => {
	it("shows the holding with its live price", async () => {
		renderWithProviders(<DashboardPage />, { preloadedState: signedIn({ _id: "u1", name: "Asha Rao" }) });

		expect(screen.getByText("Asha's Portfolio")).toBeInTheDocument();

		// Scope to the table: the symbol also appears in the summary cards.
		const row = within(await screen.findByRole("table")).getByText("INFY").closest("tr");
		expect(within(row).getByText("10")).toBeInTheDocument();
		expect(within(row).getByText("₹1,500")).toBeInTheDocument();
		// The live price, not the cost price.
		expect(within(row).getByText("₹1,600")).toBeInTheDocument();
	});

	it("offers both ways to start when the portfolio is empty", async () => {
		fetchStocks.mockResolvedValue([]);
		fetchStockHistoryById.mockResolvedValue([]);

		renderWithProviders(<DashboardPage />, { preloadedState: signedIn() });

		expect(await screen.findByText("Start your portfolio")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Add stock" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Choose backup file" })).toBeInTheDocument();
	});

	it("opens the add dialog from the toolbar", async () => {
		renderWithProviders(<DashboardPage />, { preloadedState: signedIn() });

		(await screen.findByRole("button", { name: /Add Stock/i })).click();

		expect(await screen.findByRole("dialog")).toHaveTextContent("Add Stock");
	});
});
