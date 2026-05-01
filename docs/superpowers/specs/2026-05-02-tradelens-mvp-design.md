# TradeLens MVP Design Spec

## Status

Approved design direction from brainstorming. This document records the product and technical decisions for the first MVP so future implementation work can trace why the system is shaped this way.

## Product Goal

Build a personal-first investment dashboard that can later become a general multi-user product. The MVP focuses on connecting a Longbridge stock account, showing account-level portfolio analytics, and supporting manual BTC/ETH DCA tracking.

The core product questions are:

- How much total investment capital do I currently have?
- How much am I up or down across accounts?
- Which positions contribute the most to profit or loss?
- What is my BTC/ETH DCA cost, remaining cost basis, recovered principal, and current P&L?

## Scope

### In Scope for MVP

- Email and password login through Supabase Auth.
- Personal-first deployment with data models prepared for future multi-user use.
- Longbridge account connection through the official Node.js SDK.
- Manual Longbridge sync triggered from the UI.
- Read-only Longbridge sync for account balance, stock positions, executions, orders, cash flow, and quote prices.
- Dashboard, stocks, DCA, integrations, and settings modules.
- Standard admin layout with sidebar, top bar, and module navigation.
- Default dark theme with a light theme toggle stored locally.
- Chinese-only UI copy for MVP, with code structure prepared for future i18n.
- Default USD reporting with CNY display switching.
- Manual BTC/ETH DCA records for buy and sell events.
- Menu visibility management so modules can be shown or hidden.
- UI implementation must follow `DESIGN.md`, generated from `npx getdesign@latest add binance`.

### Out of Scope for MVP

- Public multi-user registration flow beyond the supported auth foundation.
- Crypto exchange API connections for Binance, OKX, or Bitget.
- Automated scheduled sync.
- Trading, order placement, or order cancellation.
- Subscription billing, team management, or SaaS administration.
- Full English UI.

## Key Decisions

### Personal-first, multi-user-ready

The MVP serves one real user first, but every core data table includes `user_id`. This keeps the product fast to build while avoiding a later rewrite when registration and account isolation are added.

### Longbridge first

Longbridge is the first integration because the user wants a real MVP around stock assets before connecting crypto exchanges. The data model still uses generic accounts, assets, positions, transactions, and valuation snapshots so crypto connectors can map into the same model later.

### Official SDK over raw API calls

Use the official Longbridge Node.js SDK instead of hand-written HTTP calls. The SDK already covers authentication, request structure, types, and many trade/account methods. Business code should not depend on SDK details directly; it should call a `LongbridgeConnector` wrapper.

Confirmed SDK details from official docs and repository:

- Official SDK page lists Node.js support.
- Current package naming should prefer `longbridge`, while the GitHub README still references the older `longport` package name.
- Node.js SDK includes `index.d.ts`, so TypeScript usage is supported.
- SDK authentication supports `Config.fromEnv()` using `LONGPORT_APP_KEY`, `LONGPORT_APP_SECRET`, and `LONGPORT_ACCESS_TOKEN`.
- `TradeContext.accountBalance()` supports account balance data.
- `TradeContext.stockPositions()` supports stock position data.
- `TradeContext.historyExecutions()` and `TradeContext.todayExecutions()` support execution data.
- `TradeContext.historyOrders()` and `TradeContext.todayOrders()` support order data.
- `TradeContext.cashFlow()` supports cash flow data.
- `QuoteContext.quote()` supports quote prices.
- The SDK also supports trading methods such as `submitOrder()` and `cancelOrder()`, but MVP must not expose trading capabilities.

Before implementation, verify whether the installable package/export is `longbridge`, `longport`, or both.

### Manual sync first

Manual sync is the MVP trigger. It is simpler, safer, and easier to debug than scheduled background sync. Vercel free-tier serverless functions are better suited to short sync operations than long-running workers.

### Drizzle over heavier ORM patterns

Use Drizzle with Supabase Postgres. Drizzle keeps queries close to SQL while preserving TypeScript safety, which is useful for portfolio aggregation, valuation snapshots, time-series queries, and P&L calculations.

### Theme preference stays local

The theme defaults to dark and can switch to light. The preference is stored locally rather than in the database because it is a UI convenience, not core product state.

### Menu visibility is user state

Menu display and hiding should be persisted per user because it shapes how the product modules are presented. Hidden menus affect navigation only, not data access or model availability.

## Technical Architecture

- Framework: Next.js App Router.
- Hosting: Vercel.
- Database: Supabase Postgres.
- Auth: Supabase Auth.
- ORM/query layer: Drizzle.
- UI: React components styled according to `DESIGN.md`.
- Integration boundary: connector classes such as `LongbridgeConnector`.
- Sync: server-side action or API route that runs a short manual sync job.
- Charts: React-compatible charting library selected during implementation for custom dark financial dashboards.

## Information Architecture

Default visible modules:

- Dashboard
- Stocks
- DCA
- Integrations
- Settings

Available but hidden or placeholder modules:

- Crypto
- Analytics

The Dashboard aggregates total assets. Stocks, Crypto, and DCA remain separate modules so each area can have its own data model, tables, charts, and sync state.

## Design System Constraints

The generated `DESIGN.md` is the visual source of truth for MVP UI.

Important constraints:

- Default canvas is near-black `#0b0e11`.
- Primary CTA/accent is Binance yellow `#FCD535`.
- Active yellow is `#f0b90b`.
- Dark card surface is `#1e2329`.
- Elevated dark surface and dark hairlines use `#2b3139`.
- Price-up uses `#0ecb81`.
- Price-down uses `#f6465d`.
- Primary buttons use yellow background and black text.
- Trading green/red are semantic price indicators, not general success/error colors.
- Financial numbers should use a number-focused font style; if BinancePlex is unavailable, use a suitable fallback.
- The interface should avoid gradients, glassmorphism, and decorative brand colors beyond the documented tokens.

## Core Data Model

### users

Supabase Auth owns identity. Application tables reference the Supabase user id.

### broker_connections

Represents user-bound external data connections.

Fields include:

- `id`
- `user_id`
- `provider` such as `longbridge`, `binance`, `okx`, `bitget`
- `display_name`
- `status`
- `encrypted_credentials`
- `last_sync_at`
- `last_sync_status`
- `last_sync_error`

### accounts

Represents an investment account from a provider.

Fields include:

- `id`
- `user_id`
- `broker_connection_id`
- `provider`
- `account_type`
- `display_name`
- `base_currency`
- `external_account_ref`

### assets

Represents tradable or tracked assets.

Fields include:

- `id`
- `asset_type` such as `stock`, `crypto`, `cash`, `fund`
- `symbol`
- `name`
- `market`
- `currency`
- `provider_metadata`

### positions

Represents current position state after sync or manual tracking.

Fields include:

- `id`
- `user_id`
- `account_id`
- `asset_id`
- `quantity`
- `available_quantity`
- `average_cost`
- `market_price`
- `market_value`
- `unrealized_pnl`
- `currency`
- `source_updated_at`

### transactions

Represents standardized investment activity.

Fields include:

- `id`
- `user_id`
- `account_id`
- `asset_id`
- `source`
- `external_id`
- `transaction_type` such as `buy`, `sell`, `dividend`, `fee`, `deposit`, `withdrawal`, `cash_flow`
- `side`
- `quantity`
- `price`
- `gross_amount`
- `fee_amount`
- `currency`
- `executed_at`
- `raw_payload`

### valuation_snapshots

Represents point-in-time portfolio valuation.

Fields include:

- `id`
- `user_id`
- `account_id`
- `snapshot_at`
- `cash_value`
- `positions_value`
- `net_assets`
- `base_currency`
- `display_value_usd`
- `display_value_cny`
- `raw_payload`

### dca_plans

Represents a manual DCA strategy.

Fields include:

- `id`
- `user_id`
- `asset_id`
- `name`
- `base_currency`
- `status`

### dca_entries

Represents manual DCA buy and sell events.

Fields include:

- `id`
- `user_id`
- `dca_plan_id`
- `entry_type` such as `buy` or `sell`
- `quantity`
- `price`
- `fee_amount`
- `currency`
- `executed_at`
- `note`

### user_preferences

Represents persisted product preferences that should survive device changes.

Fields include:

- `id`
- `user_id`
- `base_currency`
- `visible_modules`

Theme is not stored here in MVP because it is local-only.

## Calculation Rules

- Preserve original currencies at ingestion time.
- Default reporting currency is USD.
- CNY display is a presentation conversion.
- Total assets equal cash plus market value of positions.
- Stock unrealized P&L equals current market value minus remaining cost.
- Realized P&L comes from sell proceeds minus allocated sold cost minus fees.
- DCA cumulative input equals total buy amount plus buy fees.
- DCA recovered principal equals total sell proceeds minus sell fees.
- DCA remaining cost equals cumulative input minus recovered principal.
- DCA current P&L equals current value plus recovered principal minus cumulative input.

## Longbridge Sync Flow

1. User clicks sync in the Longbridge integration or dashboard shortcut.
2. Server loads the current user and Longbridge connection credentials.
3. `LongbridgeConnector` initializes the SDK config.
4. Connector fetches account balance, stock positions, executions, orders, cash flow, and current quotes.
5. Connector maps SDK objects into the unified account, asset, position, transaction, and snapshot shapes.
6. Database writes happen in a controlled sync transaction where possible.
7. Sync status is updated with success, partial failure, or failure details.
8. Dashboard and stock pages read the updated normalized data.

## Error Handling

- Invalid credentials show a reconnect or reconfigure message.
- SDK/API failures are recorded on the connection sync state.
- Partial failures do not overwrite known-good data with incomplete data.
- Raw payloads are retained for debugging and reconciliation.
- Currency or amount anomalies are preserved and marked instead of silently producing misleading calculations.
- Trading APIs remain inaccessible in MVP even though the SDK exposes them.

## Deployment Model

### Local

Use Supabase local development through Docker and run the Next.js app locally.

### Online

Deploy the Next.js app to Vercel and use Supabase hosted Postgres/Auth on the free tier.

The design assumes sync tasks are short enough for Vercel serverless execution. If sync grows beyond that constraint, move synchronization to a separate worker later.

## Documentation Trail

Project decisions should remain traceable through:

- This design spec.
- A later implementation plan generated from this spec.
- `DESIGN.md` for UI rules.
- Future connector documentation for Longbridge and crypto exchanges.

## Open Implementation Checks

- Verify the current npm package name and imports for the Longbridge SDK.
- Decide the exact encryption approach for stored API credentials.
- Choose the charting library during implementation.
- Confirm Supabase local workflow and migration commands once the project is initialized.
- Confirm exchange-rate source for USD/CNY display conversion.

## Self Review

- No placeholders remain in the MVP scope.
- The design is intentionally focused on Longbridge and manual DCA tracking.
- Crypto exchange integrations are modeled but not implemented in MVP.
- Trading actions are explicitly excluded for safety.
- UI requirements are tied to `DESIGN.md` rather than freeform design choices.
