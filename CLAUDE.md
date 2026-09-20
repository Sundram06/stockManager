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
npm run dev:sandbox # Backend on an in-memory copy of the DB (safe for manual testing)
```

Run a single test file:
```bash
npx vitest run tests/unit/ledger.test.mjs
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
npm test           # Vitest + Testing Library (jsdom)
npm run test:watch # same, in watch mode
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

**Route files**: `system.routes.mjs`, `auth.routes.mjs`, `stock.routes.mjs`, `history.routes.mjs`, `market.routes.mjs` (instrument search lives here: `GET /api/instruments/search`), `transfer.routes.mjs` (backup/restore, see below)

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
- **Internal WS auth**: first message must be `{ type: "auth", token }` (JWT). No token in URL.
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

### FIFO Ledger (`src/utils/ledger.mjs`, `src/services/ledger.service.mjs`)

Sells are their own records: one `SellEvent` per sale (`date, quantity, price, source, externalTradeId?, importBatchId?, allocations[]`). The sell fields on `History` rows (`quantitySold, sellingPrice, dateSold, pnl`) are **caches** rebuilt from SellEvents; never write them directly.

- `replayLedger({ lots, sells })` — pure, no DB. Replays sells chronologically; lots consumed oldest trading day first, **same-day lots pooled pro-rata** with the last lot absorbing rounding (identical to the pre-ledger algorithm; frozen copy in `tests/fixtures/legacy-fifo-sell.mjs` is the test oracle). Returns lot caches, per-sell allocations, remaining qty/cost, and a `shortfall` instead of throwing.
- `ledger.service.mjs` — `loadLedger` (derives SellEvents from legacy History caches for stocks with none, source `MIGRATED_DERIVED`), `persistReplay`, `rebuildStockLedger`, `addLotAndRebuild`, `recordSell`, `withTransaction`. Every write path runs inside a Mongo transaction (Atlas replica set).
- A sale is validated by replaying the whole ledger with it added, so a backdated sell that would starve a later sale is rejected (400). A stock whose stored history can't be replayed (legacy sale dated before its purchase) returns 409 on sell or add-lot.
- Migration: `npm run migrate:sell-events` (dry run) / `-- --apply` (writes a JSON backup to `backend/backups/` first).

### Backup, restore and exports (`transfer.routes.mjs`)

`GET /api/export/json` builds the VittNest backup: `{app:"vittnest", schemaVersion:1, stocks:[{stockName, instrumentKey, lots[], sells[]}]}` with full ISO timestamps and no database ids, so a restore replays to identical numbers. `holdings.csv` and `transactions.csv` are read-only reports (not importable); `csvCell` prefixes `'` on text starting with `= + - @` so a symbol can't execute as a formula.

Import is one pipeline — parse → dedupe → simulate → preview → commit:
- `utils/portfolio-file.mjs` parses a file into `CanonicalTrade[]` (`stockName, side, date, quantity, price, source, externalTradeId?`). Broker parsers plug in here.
- `import.service.mjs` loads the stored ledger per stock, removes trades it already has (multiset on timestamp+qty+price, or `externalTradeId`), and simulates **every** option with `replayLedger`: keep, merge, replace. Nothing is written; the preview shows the numbers the commit would write.
- `commitImport` re-plans inside `withTransaction` and refuses any stock whose chosen option no longer replays. A changed-but-still-valid portfolio writes the re-planned result, which can differ from what the preview showed.
- Each commit writes an `ImportBatch` with `before` snapshots plus a per-stock `fingerprintAfter`. `undoImport` restores the raw documents (same `_id`s) for 7 days, refusing when a fingerprint no longer matches — the stock changed since, and undo would drop that change.

Frontend: `util/api/transfer.mjs`, `ImportExportMenu` (desktop), `MobileActionSheet` (behind the mobile FAB), `EmptyPortfolio` (start card; a dropped file is handed to `/import` via router state), `ImportPage`, `ImportUndoSnackbar`.

### Outbound network

`config/network.mjs` makes http(s) prefer IPv4 in development. Some networks return only AAAA records for Google while having no IPv6 route, which made the OAuth token exchange hang and sign-in return 500. `PREFER_IPV4=false` opts out; `true` forces it in production. A failed Google sign-in redirects to `/login?error=google` instead of surfacing raw JSON.

### Deletion cascades & data scripts

- Deleting a stock (`deleteStockById`, `deleteAllStocks`) removes its History and SellEvents in one transaction, and only if the stock belongs to the requesting user.
- Deleting a user cascades on the **User model** (pre `deleteOne`/`deleteMany`/`findOneAndDelete` hooks): stocks, History and SellEvents go too, joining the caller's session. `account.service.deleteUserAccount(userId)` wraps it in a transaction. There is no HTTP endpoint or UI for account deletion yet. Deletions done by hand in Atlas bypass the hooks.
- `Stock` has a unique index on `{userId, stockName}`.
- Data scripts (all dry-run by default; `-- --apply` writes a JSON backup to `backend/backups/`, git-ignored, first):
  - `npm run migrate:sell-events` — derive SellEvents for pre-ledger stocks; only migrates stocks whose replay reproduces stored numbers.
  - `npm run merge:duplicate-stocks` — merge same-user same-symbol Stock docs.
  - `npm run cleanup:orphans` — remove stocks of deleted users and History/SellEvents whose stock is gone.
- `npm run dev:sandbox` — runs the backend on an in-memory copy of the DB (copied read-only from `DB_URI` at start). Use it to test write paths in the UI without touching Atlas.

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
- `useMarketData()` — Connects to `/ws/market-data`, sends `{ type: "auth", token }` as first message, handles `snapshot` and `ltp_update` messages, exponential backoff reconnect. Returns `{ ltpMap, isConnected }`. Used in `PortfolioTable`, passed down as props.

**`activeTab`**: `0` = active stocks (`quantity > 0`), `1` = dormant stocks (`quantity ≤ 0`).

**Portfolio metrics** (`util/portfolioMetrics.mjs`):
- `computeActiveStockMetrics(stocks, historyByStockId)` — per-stock `totalInvested` and `avgPrice` from active history rows
- `computeDormantMetrics(historyRows)` — realized P&L, avg buy/sell price for fully exited positions

**API layer** (`util/api/`): All fetch calls go through `getValidTokenOrThrow()` (throws if JWT expired). Token stored in `localStorage`. Session expiry timer scheduled in `App.jsx` on mount.

**Routing** (`App.jsx`): `/` landing, `/dashboard`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/oauth-success` (handles Google OAuth redirect).

**Theme** (`theme/`): MUI theme with dark/light toggle. Mode persisted to `localStorage` under key `vittnest-theme-mode`. Brand accent: teal `#0A7B7B` (light) / `#0fb3af` (dark). Dark bg `#0a0a0a`. Fonts: DM Sans (UI), Newsreader italic (logo/display). Orange `#df6035` is retired — never use.

**Responsive**: `PortfolioViewSwitch` uses `useMediaQuery(theme.breakpoints.down('md'))` — mobile renders `PortfolioMobileList`, desktop renders `StockTable`.

**Mobile portfolio list** (`PortfolioMobileList`): Zerodha-style compact 3-line rows in a flat Paper list. Tapping a row opens a `SwipeableDrawer` action sheet (Add/Sell/History/Delete). FAB (Floating Action Button) handles "Add Stock" on mobile — collapses from pill to circle on scroll.

**Mobile history** (`StockHistoryModal`): Responsive — on mobile renders `SwipeableDrawer` with compact per-lot cards (Lot N badge, buy row ↓, sell row ↑, "still held" line for partial lots) and a pinned summary footer (Total Sold + Total Unsold). Desktop shows the full table modal unchanged. Modal is always mounted (not conditionally rendered) to allow proper animation.

---

### Conventions

- **Comments.** Comment only what is genuinely hard to follow: a non-obvious rule, a constraint that is not visible in the code, a reason a safe-looking change would break something. Readers are coders, so ordinary code needs no narration. No em dashes, no notes left over from writing the code, no references to past discussions or reviews.
- **Server data lives in React Query. Redux holds only auth.** Mutations invalidate `["stocks"]` and `["history"]`. Do not keep a second copy of server data in Redux.
- **Every backend call goes through `util/api/request.mjs`.** `apiFetch` returns the Response, `apiJson` returns parsed JSON. Both attach the token, encode the body, and throw an Error carrying the server's `message` and `code`. Components should not call `fetch`. Not yet migrated: the auth pages and the instrument search in `AddStock`.
- **Live prices come from context.** `MarketDataProvider` owns the single WebSocket; components call `useMarketPrices()`. Outside the provider it returns an empty map instead of throwing.
- **Tests.** `src/test/render.jsx` renders a component with store, query client, theme and router. Scope queries with `within(...)`: a symbol appears in both the summary cards and the table.
- **Not settled yet:** PropTypes are declared in 8 components and disabled in 12; hooks are split between `.js` and `.jsx`; `component/` is singular while `pages/` is plural.

### Instrument Token Mapping (transitional)

`assets/instruments.json` maps symbols to Upstox instrument keys:
```json
{ "trading_symbol": "INFY", "instrument_key": "NSE_EQ|INE009A01021", "exchange": "NSE", ... }
```
`trading_symbol` matches `Stock.stockName`. Used by `subscription.service.mjs` as fallback for stocks without `instrumentKey` in DB. **Phase 1 is complete** — `instrumentKey` is now stored in the `Stock` DB document for all newly added stocks. Existing stocks without it fall back to `instruments.json`.

---

## Planned Work

**Phase 5 — Real price history for stock chart: done, merged.**
- `GET /api/market/history/:instrument?range=1W|1M|3M|6M|1Y|ALL` (JWT). `:instrument` = URL-encoded instrument key, or bare symbol for pre-Phase-1 stocks (resolved via `subscriptionService.keyForSymbol`).
- `market-history.service.mjs` → Upstox `/v3/historical-candle/{key}/days/1/{to}/{from}`, normalised to ascending `{date, price(close), open, high, low, volume}`, 1h in-memory cache per key+range. ALL = 5 years, single request.
- Frontend fetches ALL once per stock (`util/api/market.mjs`, React Query key `["priceHistory", instrument]`), range pills filter client-side. Today's LTP appended as a live tip. Buy/sell markers snap to last trading day on or before the event. Recharts animation disabled (1240-point series).

**Phase 6 — Polish: done.** Teal theme on auth pages (shared `AuthShell`), no navy header in dark mode, a11y/Lighthouse pass.

**Next — broker import (Zerodha/Groww/Upstox).** The pipeline is built; only parsers and trade matching are missing. Decisions already made:
- A broker file is parsed into the same `CanonicalTrade[]` the VittNest backup produces, then reuses dedupe → simulate → preview → commit unchanged.
- Matching a broker trade against one the user typed in by hand: same calendar day (not timestamp), same side, same quantity **after grouping the broker's fills** by order id (or by day+symbol+side when the file has none), and price within 1%. Ambiguous matches are never merged silently — the preview asks.
- The broker file is the source of truth for a matched trade: its price **and its trade time** replace the manual values (manual entries store midnight, so ordering of same-day lots can change, which the preview must show as a P&L delta).
- Charges (brokerage, STT) are out of scope: manual entries have none, so mixing them would make realised P&L part net, part gross.
- Trades imported this way carry `externalTradeId`, so re-imports match exactly and the fuzzy rule runs only once per trade.

---

## Key Limitations (Current State)

- **Email sender**: Gmail SMTP via personal `GMAIL_USER`; needs dedicated account or Resend + custom domain for production.
- **Stale ISINs**: `instruments.json` may have stale ISINs (e.g. ADANIPOWER); affects only stocks added before Phase 1. Re-adding a stock via the autocomplete search fixes it permanently.
- **Upstox account must be active**: if Upstox segments deactivate (error `UDAPI100058`), WS feed 401s while REST LTP still works. Reactivate from Upstox app.

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

- `ledger.test.mjs` — replayLedger unit tests incl. 500 randomized ledgers vs the legacy algorithm
- `portfolio-file.test.mjs` — backup parsing and CSV escaping (formula-injection guard)
- `import-export.test.mjs` — export→import round trip, dedupe, conflicts, undo, replace-all (memory replica set)
- `transfer-routes.test.mjs` — download headers, 413 on oversized upload, undo routing
- `ledger-service.test.mjs` — service tests against in-memory Mongo replica set (mongodb-memory-server)
- `auth-validation.test.mjs` — 400 responses for invalid auth inputs
- `portfolio-routes.test.mjs` — Route integration tests with mocked services
- `portfolio-auth-guard.test.mjs` — 401 without bearer token
- `frontend-contract.test.mjs` — Response envelope shape assertions
- `system-api.test.mjs` — Health check + 404 handling
