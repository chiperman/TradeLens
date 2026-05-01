import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

async function main() {
  loadLocalEnv();

  const requiredEnv = ["LONGBRIDGE_APP_KEY", "LONGBRIDGE_APP_SECRET", "LONGBRIDGE_ACCESS_TOKEN"];
  const missingEnv = requiredEnv.filter((name) => !process.env[name]);

  if (missingEnv.length > 0) {
    console.error(`Missing Longbridge credentials in .env.local: ${missingEnv.join(", ")}`);
    process.exit(1);
  }

  const { LongbridgeConnector } = await import("@/integrations/longbridge/connector");
  const payload = await new LongbridgeConnector().syncReadOnly();

  console.log("Longbridge read-only smoke check succeeded.");
  console.log(`Accounts: ${payload.accountBalances.length}`);
  console.log(`Positions: ${payload.positions.length}`);
  console.log(`Executions today: ${payload.executions.length}`);

  const currencies = [...new Set(payload.accountBalances.map((account) => account.currency))];
  const positionMarkets = [...new Set(payload.positions.map((position) => position.market))];

  if (currencies.length > 0) {
    console.log(`Account currencies: ${currencies.join(", ")}`);
  }

  if (positionMarkets.length > 0) {
    console.log(`Position markets: ${positionMarkets.join(", ")}`);
  }
}

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    process.env[name] ??= stripEnvQuotes(value);
  }
}

function stripEnvQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
