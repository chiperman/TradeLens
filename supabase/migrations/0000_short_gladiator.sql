CREATE TYPE "public"."asset_type" AS ENUM('stock', 'crypto', 'cash', 'fund');--> statement-breakpoint
CREATE TYPE "public"."connection_status" AS ENUM('not_configured', 'connected', 'error');--> statement-breakpoint
CREATE TYPE "public"."dca_entry_type" AS ENUM('buy', 'sell');--> statement-breakpoint
CREATE TYPE "public"."dca_plan_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('longbridge', 'binance', 'okx', 'bitget');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('never', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('buy', 'sell', 'dividend', 'fee', 'deposit', 'withdrawal', 'cash_flow');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"broker_connection_id" uuid,
	"provider" "provider" NOT NULL,
	"account_type" text NOT NULL,
	"display_name" text NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"external_account_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"market" text,
	"currency" text NOT NULL,
	"provider_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "broker_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"display_name" text NOT NULL,
	"status" "connection_status" DEFAULT 'not_configured' NOT NULL,
	"encrypted_credentials" text,
	"last_sync_at" timestamp with time zone,
	"last_sync_status" "sync_status" DEFAULT 'never' NOT NULL,
	"last_sync_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dca_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dca_plan_id" uuid NOT NULL,
	"entry_type" "dca_entry_type" NOT NULL,
	"quantity" numeric(28, 10) NOT NULL,
	"price" numeric(28, 10) NOT NULL,
	"fee_amount" numeric(28, 10) DEFAULT '0' NOT NULL,
	"currency" text NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dca_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"name" text NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"status" "dca_plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"quantity" numeric(28, 10) NOT NULL,
	"available_quantity" numeric(28, 10),
	"average_cost" numeric(28, 10),
	"market_price" numeric(28, 10),
	"market_value" numeric(28, 10),
	"unrealized_pnl" numeric(28, 10),
	"currency" text NOT NULL,
	"source_updated_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"asset_id" uuid,
	"source" text NOT NULL,
	"external_id" text,
	"transaction_type" "transaction_type" NOT NULL,
	"side" text,
	"quantity" numeric(28, 10),
	"price" numeric(28, 10),
	"gross_amount" numeric(28, 10),
	"fee_amount" numeric(28, 10),
	"currency" text NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"visible_modules" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "valuation_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid,
	"snapshot_at" timestamp with time zone NOT NULL,
	"cash_value" numeric(28, 10) NOT NULL,
	"positions_value" numeric(28, 10) NOT NULL,
	"net_assets" numeric(28, 10) NOT NULL,
	"base_currency" text DEFAULT 'USD' NOT NULL,
	"display_value_usd" numeric(28, 10),
	"display_value_cny" numeric(28, 10),
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_broker_connection_id_broker_connections_id_fk" FOREIGN KEY ("broker_connection_id") REFERENCES "public"."broker_connections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dca_entries" ADD CONSTRAINT "dca_entries_dca_plan_id_dca_plans_id_fk" FOREIGN KEY ("dca_plan_id") REFERENCES "public"."dca_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dca_plans" ADD CONSTRAINT "dca_plans_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "positions" ADD CONSTRAINT "positions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "valuation_snapshots" ADD CONSTRAINT "valuation_snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assets_symbol_idx" ON "assets" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX "broker_connections_user_provider_idx" ON "broker_connections" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "dca_entries_user_executed_idx" ON "dca_entries" USING btree ("user_id","executed_at");--> statement-breakpoint
CREATE INDEX "positions_user_account_idx" ON "positions" USING btree ("user_id","account_id");--> statement-breakpoint
CREATE INDEX "transactions_user_executed_idx" ON "transactions" USING btree ("user_id","executed_at");--> statement-breakpoint
CREATE INDEX "valuation_snapshots_user_snapshot_idx" ON "valuation_snapshots" USING btree ("user_id","snapshot_at");