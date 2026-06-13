# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: VittNest — Stock Portfolio Tracker

An equity portfolio tracker for Indian retail investors. Core concept: FCFS/FIFO accounting — when shares are sold, costs and P&L are attributed to the **oldest purchase lots first**. The `History` model is an immutable transaction ledger; selling only updates `quantitySold` on existing rows, never deletes them.

---

## Commands

### Backend (`/backend`)

```bash
npm run dev        # Dev server with --watch and .env.development
npm start          # Production server
npm test           # Run Vitest integration + unit tests
npm run smoke      # Alias for npm test
```

Run a single test file:
```bash
npx vitest run tests/fifo-sell.test.mjs
```

Extract/rebuild instruments list from raw Upstox data:
```bash
npm run extract:instruments   # Reads complete.json → writes assets/instruments.json
npm run env:check             # Validate required env vars are present
```

### Frontend (`/frontend`)

```bash
npm run dev        # Vite dev server (port 5173)
npm run build      # Production build
npm run lint       # ESLint (0 warnings allowed)
npm run preview    # Preview production build
```

---

## Architecture

### Backend (`backend/src/`)

**Entry**: `server.mjs` → `app.mjs` → `createApp()`

**Startup sequence** (`server.mjs`):
1. `connectMongo()` — MongoDB connection
2. `extractData()` — Rebuilds `assets/instruments.json` from `assets/complete.json`
3. `createApp()` — Express app with middleware + routes
4. `initInternalWebSocket(httpServer)` — WebSocket server at `/ws/market-data`
5. `httpServer.listen(PORT)`
6. `subscriptionService.syncFromDB()` — loads active instrument keys from DB
7. `fetchAndCacheLTP(keys)` — seeds last-known prices via REST (works when market is closed)
8. `connectUpstox()` — opens Upstox WebSocket V3, subscribes to all active keys

**Middleware order** (in `app.mjs`): `requestId` → `cors` → `json` → `session` → `passport` → routes → `notFound` → `errorHandler`

**Route files**: `system.routes.mjs`, `auth.routes.mjs`, `stock.routes.mjs`, `history.routes.mjs`, `market.routes.mjs`, `instrument.routes.mjs` (Phase 1 — planned)

**Pattern**: Routes → Controllers (thin, only HTTP) → Services (all logic) → Models (Mongoose).

**Error handling**: Throw `AppError(message, statusCode)` anywhere; `asyncHandler` wraps all route handlers and forwards errors to the global `errorHandler` middleware. Response shape:
```json
{ "success": false, "message": "...", "error": { "message": "...", "requestId": "..." } }
```

**Request validation**: `validateRequest(zodSchema)` middleware populates `req.validated`. Controllers always read from `req.validated`, never `req.body`.

**Auth**: `authenticateJwt` middleware extracts `userId` from `Authorization: Bearer <token>` header and sets `req.userId`. All `/stocks`, `/history`, `/api/me` routes require it.

---

### Real-time Market Data

Single Upstox Analytics Token (1-year, server-side only) → Upstox WebSocket V3 → `marketCache` (EventEmitter, `instrumentKey → {ltp, cp, ts}`) → internal WebSocket `/ws/market-data` → frontend `useMarketData` hook → `ltpMap: { stockName → {ltp, cp} }`.

- **Upstox WS** uses protobuf (LTPC mode). Binary frames = price data (`initial_feed` / `live_feed`). Text frames = `market_info` JSON (logged only).
- **REST seed** (`market-quote.service.mjs`): `GET /v3/market-quote/ltp` called on startup and on new stock added — ensures prices show even when market is closed.
- **Internal WS auth**: currently JWT via `?token=` query param. Phase 2 will switch to first-message auth.
- **Cache keys**: `NSE_EQ|ISIN` (pipe format) internally. Converted to trading symbols before sending to frontend.
- **Provider**: `analytics-token.provider.mjs` — reads `UPSTOX_ANALYTICS_TOKEN` from env, throws if missing.

---

### Data Models

**`Stock`** — one document per user-held position:
```
stockName, quantity, avgPrice, totalCostOfStock, userId
instrumentKey   ← Phase 1: will store NSE_EQ|ISIN directly in DB
```
Live LTP, currVal, pnl are computed client-side from `ltpMap` — not persisted.

**`History`** — immutable transaction ledger row:
```
quantity, avgPrice, stockId, userId, date          ← buy fields (set on creation, never changed)
dateSold, quantitySold, sellingPrice, pnl          ← sell fields (populated by FIFO sell)
```
One History row per buy transaction. A single sell may update multiple rows (oldest first).

**`User`** — `name, email, password (bcrypt), googleId, provider ('local'|'google')`

---

### FIFO Sell Algorithm (`src/utils/fifo-sell.mjs`)

`applyFifoSell({ fifoRows, quantityToSell, sellingPrice, dateSold })`:
- Iterates history rows in insertion order (oldest first = FIFO)
- Fills `row.quantitySold` up to each row's remaining capacity
- Computes weighted avg `sellingPrice` and per-lot `pnl = qty × (sellingPrice − avgPrice)`
- Saves each row and returns `{ totalPnl, updatedRows }`

Called from `history.service.mjs` → `POST /history/sell`.

---

### Stock Quantity & Avg Price Recalculation

After every buy (`history.service.createHistory()`), the parent Stock is updated:
- `quantity` = sum of `(row.quantity − row.quantitySold)` across all history rows for that stock
- `avgPrice` = weighted average of active (unsold) lots

This means `Stock.quantity` and `Stock.avgPrice` are always derived/recomputed from the History ledger, not maintained independently.

---

### Frontend (`frontend/src/`)

**State**: Redux (`auth-slice`, `stocks-slice`) for global/auth state. React Query (`@tanstack/react-query`) for all server data (stocks, history).

**Custom hooks**:
- `useHydrateAuth` — On mount, reads localStorage token → `GET /api/me` → dispatches `login`. Sets `isAuthLoading` false when done. Run in `App.jsx`.
- `usePortfolioData({ activeTab, search })` — Fetches stocks + history via React Query, computes `historyByStockId`, `activeStockMetrics`, `filteredStocks` with `useMemo`.
- `usePortfolioActions({ setAddOpen, setDeleteModalOpen })` — All mutations (create stock, add to position, sell, delete). Calls `queryClient.invalidateQueries` on success to trigger refetch.
- `useMarketData()` — Connects to `/ws/market-data?token=<JWT>`, handles `snapshot` and `ltp_update` messages, exponential backoff reconnect. Returns `{ ltpMap, isConnected }`. Used in `PortfolioTable`, passed down as props.

**`activeTab`**: `0` = active stocks (`quantity > 0`), `1` = dormant stocks (`quantity ≤ 0`).

**Portfolio metrics** (`util/portfolioMetrics.mjs`):
- `computeActiveStockMetrics(stocks, historyByStockId)` — per-stock `totalInvested` and `avgPrice` from active history rows
- `computeDormantMetrics(historyRows)` — realized P&L, avg buy/sell price for fully exited positions

**API layer** (`util/api/`): All fetch calls go through `getValidTokenOrThrow()` (throws if JWT expired). Token stored in `localStorage`. Session expiry timer scheduled in `App.jsx` on mount.

**Routing** (`App.jsx`): `/` landing, `/dashboard`, `/login`, `/register`, `/forgot-password`, `/oauth-success` (handles Google OAuth redirect).

**Theme** (`theme/`): MUI theme with dark/light toggle. Mode persisted to `localStorage` under key `vittnest-theme-mode`. Primary brand color: `#df6035` (orange).

**Responsive**: `PortfolioViewSwitch` uses `useMediaQuery(theme.breakpoints.down('md'))` — mobile renders `PortfolioMobileList`, desktop renders `StockTable`.

**Mobile portfolio list** (`PortfolioMobileList`): Zerodha-style compact 3-line rows in a flat Paper list. Tapping a row opens a `SwipeableDrawer` action sheet (Add/Sell/History/Delete). FAB (Floating Action Button) handles "Add Stock" on mobile — collapses from pill to circle on scroll.

**Mobile history** (`StockHistoryModal`): Responsive — on mobile renders `SwipeableDrawer` with compact per-lot cards (Lot N badge, buy row ↓, sell row ↑, "still held" line for partial lots) and a pinned summary footer (Total Sold + Total Unsold). Desktop shows the full table modal unchanged. Modal is always mounted (not conditionally rendered) to allow proper animation.

---

### Instrument Token Mapping (transitional)

`assets/instruments.json` maps symbols to Upstox instrument keys:
```json
{ "trading_symbol": "INFY", "instrument_key": "NSE_EQ|INE009A01021", "exchange": "NSE", ... }
```
`trading_symbol` matches `Stock.stockName`. Used by `subscription.service.mjs` as fallback for stocks without `instrumentKey` in DB. **Phase 1 is complete** — `instrumentKey` is now stored in the `Stock` DB document for all newly added stocks. Existing stocks without it fall back to `instruments.json`.

---

## Planned Work

**Phase 2 — WebSocket First-Message Auth (pending):**
- Move JWT from WS URL query param to first message `{ type: "auth", token }` on connection open

**Next priorities (from PRODUCT_IDEAS_BRAINSTORM.md):**
- Portfolio export report (PDF/CSV/Excel)
- Backdated purchase FCFS recalculation (warn + preview diff + confirm)
- Demat account import (Zerodha/Upstox/Groww CSV)
- Chart inside stock detail (post-MVP)

---

## Key Limitations (Current State)

- **Forgot password**: logs email only, no email sending implemented.
- **`DELETE /stocks`**: missing JWT middleware (bug — should be protected).
- **Stale ISINs**: `instruments.json` may have stale ISINs (e.g. ADANIPOWER); affects only stocks added before Phase 1. Re-adding a stock via the autocomplete search fixes it permanently.
- **WebSocket JWT in URL**: `?token=` query param is a minor security concern — Phase 2 moves to first-message auth.

---

## Environment Variables

Backend `.env.development` / `.env.production`:
```
PORT, DB_URI, FE_URL
JWT_SECRET, SESSION_SECRET, AUTH_TOKEN_EXPIRY
UPSTOX_ANALYTICS_TOKEN           ← single 1-year token for all market data
UPSTOX_API_KEY, UPSTOX_API_SECRET, UPSTOX_REDIRECT_URI
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
```

Frontend `.env` (Vite):
```
VITE_API_URL=http://localhost:3000
```

---

## Testing

Tests live in `backend/tests/`. Run with Vitest in Node environment.

- `fifo-sell.test.mjs` — Unit tests for the FIFO algorithm
- `auth-validation.test.mjs` — 400 responses for invalid auth inputs
- `portfolio-routes.test.mjs` — Route integration tests with mocked services
- `portfolio-auth-guard.test.mjs` — 401 without bearer token
- `frontend-contract.test.mjs` — Response envelope shape assertions
- `system-api.test.mjs` — Health check + 404 handling
