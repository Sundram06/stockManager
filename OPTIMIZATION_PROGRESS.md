# Performance Optimization Progress

## Completed ✅

- [x] **Router stabilization** (`frontend/src/App.jsx`) - moved router creation outside component
- [x] **Route-level lazy loading** (`frontend/src/App.jsx`) - React.lazy + Suspense for code splitting
- [x] **Stable callbacks + memoization** (`PortfolioTable`, `StockTable`, `StockTableRow`) - useCallback and React.memo
- [x] **Pre-aggregated history data** (`PortfolioTable`) - single source of truth, fixes calculation mismatch
- [x] **Remove static instrument JSON from bundle** (`frontend/src/component/AddStock.jsx`) - switched to backend API fetch
- [x] **Memoize modal calculations** (`frontend/src/component/StockHistoryModal.jsx`) - memoized sorted rows and totals with useMemo
- [x] **Deferred search input** (`frontend/src/pages/DashboardPage.jsx`, `PortfolioTable.jsx`) - search filtering now uses deferred value
- [x] **Tune React Query cache** (`frontend/src/component/PortfolioTable.jsx`) - stale/gc windows increased and invalidations targeted by queryKey
- [x] **Centralize token expiry timer** (`frontend/src/util/http.mjs`, `App.jsx`) - single shared timer registration and cleanup
- [x] **Remove duplicate `react-query` v3** (`frontend/package.json`) - removed legacy react-query@3.39.3 entry

## Remaining Todos

### 1) Virtualize large tables

- **File:** `frontend/src/component/StockTable.jsx`
- **Status:** Deferred (no large datasets expected)

### 2) WebSocket feed guardrails

- **File:** `frontend/src/component/Testwebsocket.jsx`
- **Status:** Deferred (feature not yet production-ready; optimize after implementation)
