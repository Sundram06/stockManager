# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: VittNest: Stock Portfolio Tracker

An equity portfolio tracker for Indian retail investors. Core concept: FCFS/FIFO accounting: when shares are sold, costs and P&L are attributed to the **oldest purchase lots first**. Each buy is a `History` row (a lot) and each sale is a `SellEvent`; the ledger is replayed from these two to get holdings and P&L (see FIFO Ledger below).

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
1. `connectMongo()`: MongoDB connection
2. `extractData()`: Rebuilds `assets/instruments.json` from `assets/complete.json`
3. `createApp()`: Express app with middleware + routes
4. `initInternalWebSocket(httpServer)`: WebSocket server at `/ws/market-data`
5. `httpServer.listen(PORT)`
6. `subscriptionService.syncFromDB()`: loads active instrument keys from DB
7. `fetchAndCacheLTP(keys)`: seeds last-known prices via REST (works when market is closed)
8. `connectUpstox()`: opens Upstox WebSocket V3, subscribes to all active keys

**Middleware order** (in `app.mjs`): `requestId` → `helmet` → `cors` → `jsonBody` (100 KB; import routes parse their own 5 MB body after authentication, see `middlewares/json-body.mjs`) → `passport` (no sessions) → routes → `notFound` → `errorHandler`. `trust proxy` comes from `TRUST_PROXY`.

**Route files**: `system.routes.mjs`, `auth.routes.mjs`, `stock.routes.mjs`, `history.routes.mjs`, `market.routes.mjs` (instrument search lives here: `GET /api/instruments/search`), `transfer.routes.mjs` (backup/restore, see below), `contact.routes.mjs` (`POST /api/contact`: the public contact form, emailed to `CONTACT_EMAIL` with the sender as reply-to; the address never reaches the browser. Validated first, then limited to 10 per IP and 3 per sender per hour; every field is HTML-escaped with `utils/html.mjs`)

**Pattern**: Routes → Controllers (thin, only HTTP) → Services (all logic) → Models (Mongoose).

**Error handling**: Throw `AppError(message, statusCode, { code })` anywhere (`code` is optional and is sent as a top-level `code` the frontend branches on); `asyncHandler` wraps all route handlers and forwards errors to the global `errorHandler` middleware. Response shape:
```json
{ "success": false, "message": "...", "error": { "message": "...", "requestId": "..." } }
```

**Request validation**: `validateRequest(zodSchema)` middleware populates `req.validated`. Controllers always read from `req.validated`, never `req.body`.

**Auth**: `authenticateJWT` resolves `Authorization: Bearer <token>` through `services/auth-token.service.mjs` and sets `req.userId`. Every route that reads or changes user data requires it, including instrument search and `POST /logout`.
- Tokens are signed and verified only in `utils/jwt.mjs` (HS256 pinned). Each carries `ver`, which must equal the user's `tokenVersion`; `POST /logout` and a password reset increment it, so every earlier token of that user stops working (logout is per account, not per device). Checking it costs one indexed User read per request.
- The User model's `toJSON` strips the password, reset and verification token hashes, and `tokenVersion`. Return user documents, not `.lean()` objects, so this always applies.
- Login gives one answer (401 `INVALID_CREDENTIALS`) for an unknown email, a wrong password and a Google-only account, and compares against a fixed hash when there is no password so timing matches. `EMAIL_NOT_VERIFIED` is only returned after the password matches. Forgot-password answers the same for every address; Google accounts are emailed a notice instead of a reset link. Registering an existing email still says so.
- Rate limits (`middlewares/rate-limit.mjs`, in memory, per process) are set in `auth.routes.mjs`: login 10 failures per account and 50 requests per IP per 15 min; password and verification emails 3 per address and 10 per IP per hour; register 10 per IP per hour; token checks 30 per IP per 15 min. Over the limit: 429 `RATE_LIMITED`. Behind a proxy, set `TRUST_PROXY` or all users share one IP budget.
- Google sign-in has no server session. `/api/auth/google` sets the OAuth `state` in a 10-minute httpOnly cookie (`providers/oauth-state-store.mjs`), so a callback only completes in the browser that started it. The callback stores a one-minute single-use code (`LoginCode`, hashed, TTL index) and redirects to `/oauth-success#code=…`; the page posts it to `POST /api/auth/google/exchange` for `{ user, token }`. The session token never appears in a URL.

---

### Real-time Market Data

Single Upstox Analytics Token (1-year, server-side only) → Upstox WebSocket V3 → `marketCache` (EventEmitter, `instrumentKey → {ltp, cp, ts}`) → internal WebSocket `/ws/market-data` → frontend `MarketDataProvider` (runs `useMarketData`) → components read `useMarketPrices()` → `ltpMap: { stockName → {ltp, cp} }`.

- **Upstox WS** uses protobuf (LTPC mode). Binary frames = price data (`initial_feed` / `live_feed`). Text frames = `market_info` JSON (logged only).
- **REST seed** (`market-quote.service.mjs`): `GET /v3/market-quote/ltp` called on startup and on new stock added, so prices show even when market is closed.
- **Internal WS auth**: first message must be `{ type: "auth", token }`, checked like any request (revoked tokens are refused). No token in URL. Frames over 4 KB close the socket.
- **Per-user feeds**: a client only receives prices for symbols its user holds (`stock.service.listHeldSymbols`). Services that change holdings call `portfolioEvents.holdingsChanged(userId)` (`services/portfolio-events.mjs`), which reloads that user's symbols and sends a fresh snapshot.
- **Cache keys**: `NSE_EQ|ISIN` (pipe format) internally. Converted to trading symbols before sending to frontend.
- **Provider**: `analytics-token.provider.mjs`: reads `UPSTOX_ANALYTICS_TOKEN` from env, throws if missing.

---

### Data Models

**`Stock`**: one document per user-held position:
```
stockName, quantity, avgPrice, totalCostOfStock, userId
instrumentKey   ← NSE_EQ|ISIN, set when the stock is first added from search; missing on older stocks
```
`quantity`, `avgPrice` and `totalCostOfStock` are caches written by the ledger replay. Live LTP, current value and P&L are computed client-side from `ltpMap`, not persisted.

**`History`**: immutable transaction ledger row:
```
quantity, avgPrice, stockId, userId, date          ← buy fields (set on creation; an import correction may overwrite price and date)
dateSold, quantitySold, sellingPrice, pnl          ← caches rebuilt from SellEvents, never written directly
```
One History row per buy transaction.

**`SellEvent`**, **`ImportBatch`**: see FIFO Ledger and Backup sections. **`LoginCode`**: one-minute Google sign-in codes (see Auth).

**`User`**: `name, email, password (bcrypt), googleId, provider ('local'|'google'), isEmailVerified, tokenVersion`, plus hashed reset and verification tokens. `isEmailVerified` undefined means an account from before verification existed, treated as verified.

---

### FIFO Ledger (`src/utils/ledger.mjs`, `src/services/ledger.service.mjs`)

Sells are their own records: one `SellEvent` per sale (`date, quantity, price, source, externalTradeId?, importBatchId?, allocations[]`). The sell fields on `History` rows (`quantitySold, sellingPrice, dateSold, pnl`) are **caches** rebuilt from SellEvents; never write them directly.

- `replayLedger({ lots, sells })`: pure, no DB. Replays sells chronologically; lots consumed oldest trading day first, **same-day lots pooled pro-rata** with the last lot absorbing rounding (identical to the pre-ledger algorithm; frozen copy in `tests/fixtures/legacy-fifo-sell.mjs` is the test oracle). Returns lot caches, per-sell allocations, remaining qty/cost, and a `shortfall` instead of throwing.
- `ledger.service.mjs`: `loadLedger` (derives SellEvents from legacy History caches for stocks with none, source `MIGRATED_DERIVED`), `persistReplay`, `rebuildStockLedger`, `addLotAndRebuild`, `recordSell`, `withTransaction`. Every write path runs inside a Mongo transaction (Atlas replica set).
- A sale is validated by replaying the whole ledger with it added, so a backdated sell that would starve a later sale is rejected (400). A stock whose stored history can't be replayed (legacy sale dated before its purchase) returns 409 on sell or add-lot.
- Migration: `npm run migrate:sell-events` (dry run) / `-- --apply` (writes a JSON backup to `backend/backups/` first).

### Backup, restore and exports (`transfer.routes.mjs`)

`GET /api/export/json` builds the VittNest backup: `{app:"vittnest", schemaVersion:1, stocks:[{stockName, instrumentKey, lots[], sells[]}]}` with full ISO timestamps and no database ids, so a restore replays to identical numbers. `holdings.csv` and `transactions.csv` are read-only reports (not importable); `csvCell` prefixes `'` on text starting with `= + - @` so a symbol can't execute as a formula.

Import is one pipeline, in `services/transfer/`: parse, dedupe, simulate, preview, commit.
- `parsers/` turns a file into `CanonicalTrade[]` (`stockName, side, date, quantity, price, source, externalTradeId?, externalOrderId?`). Each parser exports `claims(content)` and `parse(content)`; `parsers/index.mjs` picks the first that claims the raw text. Current parsers: `vittnest.parser.mjs` (the backup JSON) and `zerodha.parser.mjs` (the tradebook CSV from Zerodha Console).
- The Zerodha parser reads columns by header name, not position, because Zerodha has reordered them between versions. Execution times are read as IST. Rows outside delivery equity (F&O, currency) are counted as skipped and shown in the preview, never imported.
- `matching.mjs` decides which file trades the ledger already has. A parser declares its rule: `exact` (backup: same timestamp, quantity and price, or same `externalTradeId`) or `day` (broker: same calendar day, broker fills grouped by order id, quantity equal, price within 1%). A stored row with two candidates on the same day is never matched; the trade is shown as new.
- A `day` match is a correction: the broker's price and fill time overwrite the hand-typed row, and its trade id is stored so a re-import recognises it exactly. Corrections appear per stock in the preview and are only written when the user chooses merge.
- `plan.service.mjs` simulates every option (keep, merge, replace) with `replayLedger` without writing. `commit.service.mjs` re-plans inside `withTransaction` and refuses any stock whose chosen option no longer replays.
- Each commit writes an `ImportBatch` with `before` snapshots plus a per-stock `fingerprintAfter`. `batches.service.mjs` undoes it for 7 days, restoring the raw documents with their original `_id`s, and refuses when a fingerprint no longer matches.

Frontend: `util/api/transfer.mjs`, `ImportExportMenu` (desktop), `MobileActionSheet` (behind the mobile FAB), `EmptyPortfolio` (start card; a dropped file is handed to `/import` via router state), `ImportPage`, `ImportUndoSnackbar`.

### Outbound network

`config/network.mjs` makes http(s) prefer IPv4 in development. Some networks return only AAAA records for Google while having no IPv6 route, which made the OAuth token exchange hang and sign-in return 500. `PREFER_IPV4=false` opts out; `true` forces it in production. A failed Google sign-in redirects to `/login?error=google` instead of surfacing raw JSON.

### Deletion cascades & data scripts

- Deleting a stock (`deleteStockById`, `deleteAllStocks`) removes its History and SellEvents in one transaction, and only if the stock belongs to the requesting user.
- Deleting a user cascades on the **User model** (pre `deleteOne`/`deleteMany`/`findOneAndDelete` hooks): stocks, History and SellEvents go too, joining the caller's session. `account.service.deleteUserAccount(userId)` wraps it in a transaction. There is no HTTP endpoint or UI for account deletion yet. Deletions done by hand in Atlas bypass the hooks.
- `Stock` has a unique index on `{userId, stockName}`.
- Data scripts (all dry-run by default; `-- --apply` writes a JSON backup to `backend/backups/`, git-ignored, first):
  - `npm run migrate:sell-events`: derive SellEvents for pre-ledger stocks; only migrates stocks whose replay reproduces stored numbers.
  - `npm run merge:duplicate-stocks`: merge same-user same-symbol Stock docs.
  - `npm run cleanup:orphans`: remove stocks of deleted users and History/SellEvents whose stock is gone.
- `npm run dev:sandbox`: runs the backend on an in-memory copy of the DB (copied read-only from `DB_URI` at start). Use it to test write paths in the UI without touching Atlas.

### Stock Quantity & Avg Price Recalculation

Adding a lot to an existing stock (`history.service.createHistory`, or `stock.service` when the symbol is already held) goes through `ledger.addLotAndRebuild`, which replays the ledger and writes `quantity` (unsold shares) and `avgPrice` (weighted average of unsold lots) back to the Stock. They are never maintained independently.

`GET /stocks` (`stock.service.listStocksForUser`) recomputes quantity and average from the unsold lots in two queries whatever the portfolio size: all the user's stocks, then all their lots in one `$in` query sorted `{stockId, date, _id}`, grouped in memory. The sort matches the old per-stock queries so the floating-point sums are identical; `tests/fixtures/legacy-list-stocks.mjs` is the oracle.

---

### Frontend (`frontend/src/`)

**State**: Redux holds only auth (`auth-slice`). React Query (`@tanstack/react-query`) holds all server data (stocks, history, price history).

**Custom hooks**:
- `useHydrateAuth`: On mount, reads localStorage token → `GET /api/me` → dispatches `login`. Sets `isAuthLoading` false when done. Run in `App.jsx`.
- `useCompleteSignIn`: the one place password and Google sign-in finish: stores the token, dispatches `login`, starts loading the dashboard (`util/preloadDashboard.mjs`: its code chunk plus the stocks and history queries) and navigates to `/dashboard`.
- `usePortfolioData({ activeTab, search })`: Fetches stocks + history via React Query (query definitions shared in `util/api/portfolioQueries.mjs`, also used by `PortfolioSummary` and the sign-in prefetch), computes `historyByStockId`, `activeStockMetrics`, `filteredStocks` with `useMemo`.
- `usePortfolioActions({ setAddOpen, setDeleteModalOpen })`: All mutations (create stock, add to position, sell, delete). Calls `queryClient.invalidateQueries` on success to trigger refetch.
- `useMarketData()`: Connects to `/ws/market-data`, sends `{ type: "auth", token }` as first message, handles `snapshot` and `ltp_update` messages, exponential backoff reconnect. Returns `{ ltpMap, isConnected }`. Called only by `MarketDataProvider` (`context/MarketDataContext.jsx`), mounted on the dashboard; components use `useMarketPrices()`.

**`activeTab`**: `0` = active stocks (`quantity > 0`), `1` = dormant stocks (`quantity ≤ 0`).

**Loading states**: `FullPageLoader` (wordmark, spinner, message) covers sign-in and the auth check. While the first stocks and history load, `PortfolioSummary` shows skeleton cards and `PortfolioTable` shows `PortfolioSkeleton` (table columns from `stockTableColumns.js` on desktop, compact rows on mobile), never zero values. Both skeletons are `role="status"` regions named "Loading your …"; tests call `waitForPortfolio()` from `render.jsx` before reading data.

**Portfolio metrics** (`util/portfolioMetrics.mjs`):
- `computeActiveStockMetrics(stocks, historyByStockId)`: per-stock `totalInvested` and `avgPrice` from active history rows
- `computeDormantMetrics(historyRows)`: realized P&L, avg buy/sell price for fully exited positions
- `liveStockMetrics`, `priceDayChange`, `portfolioTotals`: current value, P&L and day change from `ltpMap`. All money math lives in this file; formatting (`rupee`, `signedRupee`, `percent`, `toneColor`) lives in `util/format.mjs`.

**API layer** (`util/api/`): `request.mjs` attaches the token via `session.getValidTokenOrThrow()` (throws if the JWT expired). Token stored in `localStorage`. Session expiry timer scheduled in `App.jsx` on mount. Logout calls `POST /logout` so the server revokes the token, then clears it locally.

**Routing** (`App.jsx`): `/` landing, `/dashboard`, `/import`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/oauth-success` (exchanges the Google one-time code), `/privacy`, `/terms`, `/contact`. Public pages must also be listed in `Root.jsx` so the signed-in header is hidden. Every page and the chart modal load through `util/lazyWithReload.mjs`: when a chunk is missing after a deploy, the tab reloads once (at most once per 10 s, never offline) instead of showing the router's error page.

**Landing and public pages**: `pages/LandingPage.jsx` only composes sections from `component/landing/`. All copy is data in `component/landing/landingContent.js` and `component/legal/legalContent.js`; every statement there must stay true of the shipped app, so update them with any feature change. The FIFO example's numbers are computed from its trades (`landing/fifoMath.js`). `PublicPageLayout` (nav, column, `SiteFooter`) frames the legal and contact pages.

**Theme** (`theme/`): MUI theme with dark/light toggle. Mode persisted to `localStorage` under key `vittnest-theme-mode`. Brand accent: teal `#0A7B7B` (light) / `#0fb3af` (dark). Dark bg `#0a0a0a`. Fonts: DM Sans (UI), Newsreader italic (logo/display). Orange `#df6035` is retired; never use.

**Responsive**: `PortfolioViewSwitch` uses `useMediaQuery(theme.breakpoints.down('md'))`: mobile renders `PortfolioMobileList`, desktop renders `StockTable`.

**Mobile portfolio list** (`PortfolioMobileList`): Zerodha-style compact 3-line rows in a flat Paper list. Tapping a row opens a `SwipeableDrawer` action sheet (Add/Sell/History/Delete). On phones a 48 px round "+" FAB opens `MobileActionSheet` (add, import, export); the dashboard adds bottom padding so the last row scrolls clear of it.

**Mobile history** (`StockHistoryModal`): On mobile it renders `SwipeableDrawer` with compact per-lot cards (Lot N badge, buy row ↓, sell row ↑, "still held" line for partial lots) and a pinned summary footer (Total Sold + Total Unsold). Desktop shows the full table modal unchanged. Modal is always mounted (not conditionally rendered) to allow proper animation.

---

### Conventions

- **Comments.** Comment only what is genuinely hard to follow: a non-obvious rule, a constraint that is not visible in the code, a reason a safe-looking change would break something. Readers are coders, so ordinary code needs no narration. No em dashes, no notes left over from writing the code, no references to past discussions or reviews.
- **Commits and pull requests.** Commit or push only when the owner says so for that change; they review every diff first. Never push to master (protected: PR plus both CI checks). No Claude or AI attribution lines (`Co-Authored-By`, "Generated with") in commits or PR descriptions. The commit body leads with why the change could not wait, then lists what to rework later. Author email is `sundramgupta9@gmail.com`; set it with `git config --local user.email` in a new clone, never globally. Never put real portfolio figures in commits, fixtures or test data.
- **Server data lives in React Query. Redux holds only auth.** Mutations invalidate `["stocks"]` and `["history"]`. Do not keep a second copy of server data in Redux.
- **Every backend call goes through `util/api/request.mjs`.** `apiFetch` returns the Response, `apiJson` returns parsed JSON. Both attach the token, encode the body, and throw an Error carrying the server's `message` and `code`. Components should not call `fetch`. Not yet migrated: the verify, forgot-password and reset-password pages, and `useHydrateAuth`.
- **Live prices come from context.** `MarketDataProvider` owns the single WebSocket; components call `useMarketPrices()`. Outside the provider it returns an empty map instead of throwing.
- **Tests.** `src/test/render.jsx` renders a component with store, query client, theme and router. Scope queries with `within(...)`: a symbol appears in both the summary cards and the table.
- **Not settled yet:** PropTypes are declared in 8 components and disabled in 12; hooks are split between `.js` and `.jsx`; `component/` is singular while `pages/` is plural.

### Instrument Token Mapping (transitional)

`assets/instruments.json` maps symbols to Upstox instrument keys:
```json
{ "trading_symbol": "INFY", "instrument_key": "NSE_EQ|INE009A01021", "exchange": "NSE", ... }
```
`trading_symbol` matches `Stock.stockName`. Used by `subscription.service.mjs` for stocks without `instrumentKey`, and by instrument search when Upstox's search API fails. The file is built from the bundled `assets/complete.json`, a snapshot that goes stale: when a company's ISIN changes (usually a split or face-value change), Upstox prices only the new key, and a stock still on the old key gets no LTP.

Indian equity ISINs read `IN` + issuer type (`E` = company) + 4-character issuer code + 2-digit security type (`01` = equity share) + 2-digit serial + check digit. A split bumps the serial (`INE814H01011` → `INE814H01029`); the issuer code stays the same. The issuer code alone is not unique to a stock: a company's bonds and debentures share it under other security types.

---

## Planned Work

**Phase 5, real price history for stock chart: done, merged.**
- `GET /api/market/history/:instrument?range=1W|1M|3M|6M|1Y|ALL` (JWT). `:instrument` = URL-encoded instrument key, or bare symbol for pre-Phase-1 stocks (resolved via `subscriptionService.keyForSymbol`).
- `market-history.service.mjs` → Upstox `/v3/historical-candle/{key}/days/1/{to}/{from}`, normalised to ascending `{date, price(close), open, high, low, volume}`, 1h in-memory cache per key+range. ALL = 5 years, single request.
- Frontend fetches ALL once per stock (`util/api/market.mjs`, React Query key `["priceHistory", instrument]`), range pills filter client-side. Today's LTP appended as a live tip. Buy/sell markers snap to last trading day on or before the event. Recharts animation disabled (1240-point series).

**Phase 6, polish: done.** Teal theme on auth pages (shared `AuthShell`), no navy header in dark mode, a11y/Lighthouse pass.

**Broker import.** Zerodha tradebook CSV is supported. Groww and Upstox need their own parsers in `services/transfer/parsers/`. Kite Connect cannot replace the CSV: its trades endpoint covers the current day only, it is licensed for the developer's own account, and tokens expire daily. Rules the parsers follow:
- A broker file is parsed into the same `CanonicalTrade[]` the VittNest backup produces, then reuses dedupe → simulate → preview → commit unchanged.
- Matching a broker trade against one the user typed in by hand: same calendar day (not timestamp), same side, same quantity **after grouping the broker's fills** by order id (or by day+symbol+side when the file has none), and price within 1%. Ambiguous matches are never merged silently; the preview asks.
- The broker file is the source of truth for a matched trade: its price **and its trade time** replace the manual values (manual entries store midnight, so ordering of same-day lots can change, which the preview must show as a P&L delta).
- Charges (brokerage, STT) are out of scope: manual entries have none, so mixing them would make realised P&L part net, part gross.
- Trades imported this way carry `externalTradeId`, so re-imports match exactly and the fuzzy rule runs only once per trade.

**Live instrument list (fix A): built, on branch `feat/live-instrument-list`, not merged.** Downloads Upstox's current NSE instrument file at startup and daily (`instrument-master.service.mjs`), and replaces a stored key only when the live list no longer has it. Includes `npm run fix:instrument-keys` to repair stored keys. Held until split handling lands: once a split stock gets a live price, its pre-split lots would show a false loss.

**Split and bonus handling (fix B): designed, not built.**
- Detect from an ISIN change, or from the purchase price against Upstox's split-adjusted candles; suggest a ratio; the user confirms. Never apply silently.
- Store a corporate-action event the ledger replays. History rows stay as entered; the UI shows split-adjusted quantity and price.
- First test: a lot bought, partly sold, then split; the earlier sale's pnl and allocations must not change. The legacy FIFO oracle cannot validate splits.

---

## Key Limitations (Current State)

- **Email sender**: Gmail SMTP via personal `GMAIL_USER`; needs dedicated account or Resend + custom domain for production. All mail goes through `sendEmail` in `utils/email.mjs`; without credentials nothing is sent, and the link is logged only outside production.
- **Caches** (`utils/ttl-cache.mjs`) are in memory per process and capped: 500 search queries, 200 price-history series.
- **Stale instrument keys**: a stock whose ISIN changed after it was added (e.g. ADANIPOWER after its split) shows no LTP. Adding another lot does not repair it: the stored `instrumentKey` is only set when the stock is first created. Fix A (above) resolves it.
- **Upstox account must be active**: if Upstox segments deactivate (error `UDAPI100058`), WS feed 401s while REST LTP still works. Reactivate from Upstox app.

---

## Environment Variables

Backend `.env.development` / `.env.production`:
```
PORT, DB_URI, FE_URL
JWT_SECRET
TRUST_PROXY                      ← number of proxies in front of the app (e.g. 1); unset = none
UPSTOX_ANALYTICS_TOKEN           ← single 1-year token for all market data
GMAIL_USER, GMAIL_APP_PASSWORD, APP_URL
CONTACT_EMAIL                    ← where contact-form messages go; without it the form answers 503
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
```

Frontend `.env` (Vite):
```
VITE_API_URL=http://localhost:3000
```

---

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on pushes to master. Two jobs, both must pass:

- **Backend:** `npm ci`, `npm test`. The tests start an in-memory MongoDB replica set, so no database or env file is needed. The MongoDB binary is cached between runs and downloaded in its own step before the tests: the test files run in parallel, and on a cold cache they raced on the download's lock file.
- **Frontend:** `npm ci`, `npm run lint`, `npm test`, `npm run build`.

Run the same commands locally before pushing. Use `npm run lint`, not `npx eslint src`: on ESLint 8 a bare directory lints only `.js` files and silently skips every `.jsx`.

## Testing

Frontend tests live in `frontend/src/test/` (Vitest, jsdom, Testing Library): `dashboard`, `portfolioSummary`, `portfolioMetrics`, `authFlows` (login, Google code exchange, logout), `lazyWithReload`.

Backend tests live in `backend/tests/` (`unit/`, `integration/`). Run with Vitest in Node environment.

- `ledger.test.mjs`: replayLedger unit tests incl. 500 randomized ledgers vs the legacy algorithm
- `transfer-file.test.mjs`: backup parsing and CSV escaping (formula-injection guard)
- `zerodha-parser.test.mjs`: tradebook columns in either order, IST times, skipped segments, missing columns
- `zerodha-import.test.mjs`: tradebook over a hand-typed portfolio: corrections, split fills, ambiguity, re-import, undo
- `import-export.test.mjs`: export→import round trip, dedupe, conflicts, undo, replace-all (memory replica set)
- `transfer-routes.test.mjs`: download headers, 413 on oversized upload, undo routing
- `list-stocks.test.mjs`: batched holdings list matches the per-stock oracle on 20 random portfolios and issues one History query
- `ledger-service.test.mjs`: service tests against in-memory Mongo replica set (mongodb-memory-server)
- `auth-validation.test.mjs`: 400 responses for invalid auth inputs
- `auth-security.test.mjs`: no secrets in user responses, one login answer, rate limits, logout and reset revocation, algorithm pinning, Google code exchange
- `http-security.test.mjs`: security headers, body limits, removed Upstox login routes
- `instrument-search-route.test.mjs`: search requires a token and validates `q`
- `market-data-websocket.test.mjs`: 4 KB frame limit, revoked tokens, per-user price feeds
- `contact-route.test.mjs`: contact form delivery, validation, header-injection guard, rate limit, 503 when unconfigured
- `ttl-cache.test.mjs`, `oauth-state-store.test.mjs`, `html.test.mjs`: unit tests
- `portfolio-routes.test.mjs`: Route integration tests with mocked services
- `portfolio-auth-guard.test.mjs`: 401 without bearer token
- `frontend-contract.test.mjs`: Response envelope shape assertions
- `system-api.test.mjs`: Health check + 404 handling
