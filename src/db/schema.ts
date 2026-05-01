import { relations } from "drizzle-orm";
import { index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["longbridge", "binance", "okx", "bitget"]);
export const connectionStatusEnum = pgEnum("connection_status", [
  "not_configured",
  "connected",
  "error",
]);
export const syncStatusEnum = pgEnum("sync_status", ["never", "success", "partial", "failed"]);
export const assetTypeEnum = pgEnum("asset_type", ["stock", "crypto", "cash", "fund"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "buy",
  "sell",
  "dividend",
  "fee",
  "deposit",
  "withdrawal",
  "cash_flow",
]);
export const dcaEntryTypeEnum = pgEnum("dca_entry_type", ["buy", "sell"]);
export const dcaPlanStatusEnum = pgEnum("dca_plan_status", ["active", "archived"]);

export const brokerConnections = pgTable(
  "broker_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    provider: providerEnum("provider").notNull(),
    displayName: text("display_name").notNull(),
    status: connectionStatusEnum("status").notNull().default("not_configured"),
    encryptedCredentials: text("encrypted_credentials"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastSyncStatus: syncStatusEnum("last_sync_status").notNull().default("never"),
    lastSyncError: text("last_sync_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("broker_connections_user_provider_idx").on(table.userId, table.provider)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    brokerConnectionId: uuid("broker_connection_id").references(() => brokerConnections.id),
    provider: providerEnum("provider").notNull(),
    accountType: text("account_type").notNull(),
    displayName: text("display_name").notNull(),
    baseCurrency: text("base_currency").notNull().default("USD"),
    externalAccountRef: text("external_account_ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("accounts_user_idx").on(table.userId)],
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetType: assetTypeEnum("asset_type").notNull(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    market: text("market"),
    currency: text("currency").notNull(),
    providerMetadata: jsonb("provider_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("assets_symbol_idx").on(table.symbol)],
);

export const positions = pgTable(
  "positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    quantity: numeric("quantity", { precision: 28, scale: 10 }).notNull(),
    availableQuantity: numeric("available_quantity", { precision: 28, scale: 10 }),
    averageCost: numeric("average_cost", { precision: 28, scale: 10 }),
    marketPrice: numeric("market_price", { precision: 28, scale: 10 }),
    marketValue: numeric("market_value", { precision: 28, scale: 10 }),
    unrealizedPnl: numeric("unrealized_pnl", { precision: 28, scale: 10 }),
    currency: text("currency").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("positions_user_account_idx").on(table.userId, table.accountId)],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id").references(() => accounts.id),
    assetId: uuid("asset_id").references(() => assets.id),
    source: text("source").notNull(),
    externalId: text("external_id"),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    side: text("side"),
    quantity: numeric("quantity", { precision: 28, scale: 10 }),
    price: numeric("price", { precision: 28, scale: 10 }),
    grossAmount: numeric("gross_amount", { precision: 28, scale: 10 }),
    feeAmount: numeric("fee_amount", { precision: 28, scale: 10 }),
    currency: text("currency").notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("transactions_user_executed_idx").on(table.userId, table.executedAt)],
);

export const valuationSnapshots = pgTable(
  "valuation_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id").references(() => accounts.id),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull(),
    cashValue: numeric("cash_value", { precision: 28, scale: 10 }).notNull(),
    positionsValue: numeric("positions_value", { precision: 28, scale: 10 }).notNull(),
    netAssets: numeric("net_assets", { precision: 28, scale: 10 }).notNull(),
    baseCurrency: text("base_currency").notNull().default("USD"),
    displayValueUsd: numeric("display_value_usd", { precision: 28, scale: 10 }),
    displayValueCny: numeric("display_value_cny", { precision: 28, scale: 10 }),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("valuation_snapshots_user_snapshot_idx").on(table.userId, table.snapshotAt)],
);

export const dcaPlans = pgTable("dca_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  status: dcaPlanStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dcaEntries = pgTable(
  "dca_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    dcaPlanId: uuid("dca_plan_id")
      .notNull()
      .references(() => dcaPlans.id),
    entryType: dcaEntryTypeEnum("entry_type").notNull(),
    quantity: numeric("quantity", { precision: 28, scale: 10 }).notNull(),
    price: numeric("price", { precision: 28, scale: 10 }).notNull(),
    feeAmount: numeric("fee_amount", { precision: 28, scale: 10 }).notNull().default("0"),
    currency: text("currency").notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("dca_entries_user_executed_idx").on(table.userId, table.executedAt)],
);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  visibleModules: jsonb("visible_modules").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brokerConnectionsRelations = relations(brokerConnections, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  brokerConnection: one(brokerConnections, {
    fields: [accounts.brokerConnectionId],
    references: [brokerConnections.id],
  }),
  positions: many(positions),
  transactions: many(transactions),
}));
