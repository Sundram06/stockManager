import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "./render.jsx";

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

const PortfolioSummary = (await import("../component/PortfolioSummary")).default;
const { MarketDataProvider } = await import("../context/MarketDataContext");

vi.mock("../hooks/useMarketData", () => ({
	default: () => ({ ltpMap: globalThis.__ltpMap ?? {}, isConnected: true }),
}));

function renderSummary({ stocks, history, ltpMap }) {
	fetchStocks.mockResolvedValue(stocks);
	fetchStockHistoryById.mockResolvedValue(history);
	globalThis.__ltpMap = ltpMap;
	return renderWithProviders(
		<MarketDataProvider>
			<PortfolioSummary />
		</MarketDataProvider>,
	);
}

const cardFor = async (label) => (await screen.findByText(label)).closest("div");

describe("summary cards", () => {
	const losing = {
		stocks: [{ _id: "s1", stockName: "FORCEMOT", quantity: 6, avgPrice: 18161.3 }],
		history: [{ _id: "h1", stockId: "s1", quantity: 6, avgPrice: 18161.3, date: "2025-01-06T00:00:00.000Z", quantitySold: 0 }],
		ltpMap: { FORCEMOT: { ltp: 17488, cp: 17650 } },
	};

	it("shows the best performer in loss colours when every holding is down", async () => {
		renderSummary(losing);

		const best = await cardFor("Best Performer");
		expect(within(best).getByText("FORCEMOT")).toBeInTheDocument();
		// A falling stock is still a fall, even when it is the best one held.
		expect(within(best).getByTestId("TrendingDownIcon")).toBeInTheDocument();
		expect(within(best).getByText(/-3\.71%/)).toBeInTheDocument();
	});

	it("shows a rising best performer with the up arrow", async () => {
		renderSummary({
			...losing,
			ltpMap: { FORCEMOT: { ltp: 19000, cp: 18800 } },
		});

		const best = await cardFor("Best Performer");
		expect(within(best).getByTestId("TrendingUpIcon")).toBeInTheDocument();
	});
});
