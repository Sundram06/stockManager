import { describe, expect, it } from "vitest";
import { replayLedger, deriveLegacySellEvents } from "../../src/utils/ledger.mjs";
import { applyFifoSell as legacyApplyFifoSell } from "../fixtures/legacy-fifo-sell.mjs";

const d = (s) => new Date(`${s}T00:00:00.000Z`);
const lot = (id, date, quantity, avgPrice) => ({ id, date: d(date), quantity, avgPrice });
const sell = (id, date, quantity, price) => ({ id, date: d(date), quantity, price });
const byId = (result) => Object.fromEntries(result.lots.map((l) => [l.id, l]));

// Runs the pre-ledger algorithm the way the old sell endpoint did: one sell at a
// time, in date order, against lots dated on/before the sell with shares left.
async function legacyReplay(lots, sells) {
	const rows = lots.map((l) => ({
		...l,
		quantitySold: 0,
		sellingPrice: 0,
		pnl: 0,
		dateSold: null,
		save: async () => {},
	}));
	const ordered = [...sells].sort((a, b) => a.date - b.date);
	for (const s of ordered) {
		const fifoRows = rows.filter((r) => r.date <= s.date && r.quantity - r.quantitySold > 0);
		const res = await legacyApplyFifoSell({
			fifoRows,
			quantityToSell: s.quantity,
			sellingPrice: s.price,
			dateSold: s.date,
		});
		if (res.error) return { error: res.error, rows };
	}
	return { rows };
}

describe("replayLedger — ported legacy cases", () => {
	it("sells in FIFO order and computes pnl", () => {
		const r = replayLedger({
			lots: [lot("a", "2025-01-01", 10, 100), lot("b", "2025-02-01", 5, 120)],
			sells: [sell("s", "2026-01-01", 12, 130)],
		});
		expect(r.shortfall).toBeNull();
		expect(r.sells[0].pnl).toBe(320);
		expect(byId(r).a.quantitySold).toBe(10);
		expect(byId(r).b.quantitySold).toBe(2);
		expect(r.remainingQuantity).toBe(3);
	});

	it("reports a shortfall when the sell exceeds available stock", () => {
		const r = replayLedger({
			lots: [lot("a", "2025-01-01", 3, 100)],
			sells: [sell("s", "2026-01-01", 5, 110)],
		});
		expect(r.shortfall).toEqual({ sellId: "s", date: d("2026-01-01"), requested: 5, filled: 3 });
	});
});

describe("replayLedger — the bug it fixes", () => {
	it("keeps two separate sells of one lot as two sells", () => {
		const r = replayLedger({
			lots: [lot("a", "2025-01-01", 10, 100)],
			sells: [sell("feb", "2025-02-01", 5, 120), sell("mar", "2025-03-01", 5, 80)],
		});
		expect(r.sells).toEqual([
			{ id: "feb", allocations: [{ lotId: "a", quantity: 5, buyPrice: 100, pnl: 100 }], pnl: 100 },
			{ id: "mar", allocations: [{ lotId: "a", quantity: 5, buyPrice: 100, pnl: -100 }], pnl: -100 },
		]);
		// The lot cache still shows the blended view the frontend reads today.
		expect(byId(r).a).toMatchObject({ quantitySold: 10, sellingPrice: 100, pnl: 0 });
		expect(byId(r).a.dateSold).toEqual(d("2025-03-01"));
	});

	it("replays a backdated lot correctly because sells are stored, not reconstructed", () => {
		// Buy 10 @100 (Jan), sell 5 @120 (Feb), sell 5 @80 (Mar), then a backdated
		// buy of 4 @50 in December is inserted. FIFO must now consume December first.
		const r = replayLedger({
			lots: [lot("dec", "2024-12-01", 4, 50), lot("jan", "2025-01-01", 10, 100)],
			sells: [sell("feb", "2025-02-01", 5, 120), sell("mar", "2025-03-01", 5, 80)],
		});
		expect(r.sells[0].allocations).toEqual([
			{ lotId: "dec", quantity: 4, buyPrice: 50, pnl: 280 },
			{ lotId: "jan", quantity: 1, buyPrice: 100, pnl: 20 },
		]);
		expect(r.sells[1].allocations).toEqual([{ lotId: "jan", quantity: 5, buyPrice: 100, pnl: -100 }]);
		expect(r.remainingQuantity).toBe(4);
	});

	it("never lets a sell draw on a lot bought after it", () => {
		const r = replayLedger({
			lots: [lot("a", "2025-01-01", 5, 100), lot("later", "2025-06-01", 50, 90)],
			sells: [sell("s", "2025-03-01", 8, 110)],
		});
		expect(r.shortfall).toMatchObject({ requested: 8, filled: 5 });
	});
});

describe("replayLedger — same-day pooling is preserved exactly", () => {
	it("splits a sell pro-rata across same-day lots", () => {
		const r = replayLedger({
			lots: [lot("x", "2025-01-01", 30, 100), lot("y", "2025-01-01", 10, 200)],
			sells: [sell("s", "2025-02-01", 20, 150)],
		});
		expect(byId(r).x.quantitySold).toBe(15);
		expect(byId(r).y.quantitySold).toBe(5);
	});

	it("gives the rounding remainder to the last lot of the day", () => {
		const r = replayLedger({
			lots: [lot("x", "2025-01-01", 1, 100), lot("y", "2025-01-01", 1, 110), lot("z", "2025-01-01", 1, 120)],
			sells: [sell("s", "2025-02-01", 2, 130)],
		});
		// round(2 * 1/3) = 1 for x and y, z absorbs 2 - 2 = 0 and is skipped.
		expect([byId(r).x.quantitySold, byId(r).y.quantitySold, byId(r).z.quantitySold]).toEqual([1, 1, 0]);
	});

	it("matches the legacy algorithm on an odd-quantity same-day split", async () => {
		const lots = [lot("x", "2025-01-01", 7, 101.5), lot("y", "2025-01-01", 4, 99.25), lot("z", "2025-01-02", 9, 120)];
		const sells = [sell("s1", "2025-02-01", 5, 130), sell("s2", "2025-03-01", 9, 90.1)];
		const legacy = await legacyReplay(lots, sells);
		const r = replayLedger({ lots, sells });
		for (const row of legacy.rows) {
			const ours = byId(r)[row.id];
			expect(ours.quantitySold).toBe(row.quantitySold);
			expect(ours.pnl).toBe(row.pnl);
			expect(ours.sellingPrice).toBeCloseTo(row.sellingPrice, 10);
		}
	});
});

describe("replayLedger — randomized equivalence with the legacy algorithm", () => {
	// Deterministic PRNG so failures reproduce.
	const rng = (seed) => () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 2 ** 32;
	};

	it("produces identical lot state across 500 random ledgers", async () => {
		const rand = rng(42);
		const days = ["2025-01-01", "2025-01-02", "2025-01-03", "2025-02-10", "2025-03-15", "2025-04-01"];
		for (let trial = 0; trial < 500; trial++) {
			const lots = [];
			const nLots = 1 + Math.floor(rand() * 6);
			for (let i = 0; i < nLots; i++) {
				lots.push(lot(`l${i}`, days[Math.floor(rand() * 4)], 1 + Math.floor(rand() * 40), 50 + Math.round(rand() * 20000) / 100));
			}
			lots.sort((a, b) => a.date - b.date);

			const sells = [];
			const nSells = Math.floor(rand() * 4);
			for (let i = 0; i < nSells; i++) {
				sells.push(sell(`s${i}`, days[2 + Math.floor(rand() * 4)], 1 + Math.floor(rand() * 25), 40 + Math.round(rand() * 25000) / 100));
			}

			const legacy = await legacyReplay(lots, sells);
			const r = replayLedger({ lots, sells });

			if (legacy.error) {
				expect(r.shortfall, `trial ${trial}`).not.toBeNull();
				continue;
			}
			expect(r.shortfall, `trial ${trial}`).toBeNull();
			for (const row of legacy.rows) {
				const ours = byId(r)[row.id];
				expect(ours.quantitySold, `trial ${trial} ${row.id}`).toBe(row.quantitySold);
				expect(ours.pnl, `trial ${trial} ${row.id}`).toBe(row.pnl);
				expect(ours.sellingPrice, `trial ${trial} ${row.id}`).toBeCloseTo(row.sellingPrice, 9);
			}
		}
	});
});

describe("deriveLegacySellEvents", () => {
	it("groups rows by sale date and price like the old recalculation", () => {
		const rows = [
			{ quantitySold: 4, dateSold: d("2025-02-01"), sellingPrice: 120 },
			{ quantitySold: 6, dateSold: d("2025-02-01"), sellingPrice: 120 },
			{ quantitySold: 3, dateSold: d("2025-01-15"), sellingPrice: 90 },
			{ quantitySold: 0, dateSold: null, sellingPrice: 0 },
		];
		expect(deriveLegacySellEvents(rows)).toEqual([
			{ date: d("2025-01-15"), price: 90, quantity: 3 },
			{ date: d("2025-02-01"), price: 120, quantity: 10 },
		]);
	});
});
