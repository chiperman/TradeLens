import { Config, TradeContext, type Language } from "longbridge";
import { getServerEnv } from "@/lib/env";
import { mapAccountBalance, mapExecution, mapStockPositions } from "./mappers";
import type { LongbridgeSyncPayload } from "./types";

type LongbridgeCredentials = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  language?: Language;
};

export class LongbridgeConnector {
  private readonly credentials: LongbridgeCredentials;
  private tradeContext?: TradeContext;

  constructor(credentials = loadLongbridgeCredentials()) {
    this.credentials = credentials;
  }

  async syncReadOnly(): Promise<LongbridgeSyncPayload> {
    const tradeContext = this.getTradeContext();
    const [accountBalances, stockPositionsResponse, executions] = await Promise.all([
      tradeContext.accountBalance(),
      tradeContext.stockPositions(),
      tradeContext.todayExecutions(),
    ]);

    return {
      accountBalances: accountBalances.map(mapAccountBalance),
      positions: mapStockPositions(stockPositionsResponse),
      executions: executions.map(mapExecution),
    };
  }

  submitOrder(): never {
    throw new Error("TradeLens MVP is read-only and does not support order submission.");
  }

  cancelOrder(): never {
    throw new Error("TradeLens MVP is read-only and does not support order cancellation.");
  }

  private getTradeContext() {
    if (!this.tradeContext) {
      const config = Config.fromApikey(
        this.credentials.appKey,
        this.credentials.appSecret,
        this.credentials.accessToken,
        this.credentials.language ? { language: this.credentials.language } : undefined,
      );

      this.tradeContext = TradeContext.new(config);
    }

    return this.tradeContext;
  }
}

function loadLongbridgeCredentials(): LongbridgeCredentials {
  const env = getServerEnv();

  if (!env.LONGBRIDGE_APP_KEY || !env.LONGBRIDGE_APP_SECRET || !env.LONGBRIDGE_ACCESS_TOKEN) {
    throw new Error(
      "Missing Longbridge credentials. Set LONGBRIDGE_APP_KEY, LONGBRIDGE_APP_SECRET, and LONGBRIDGE_ACCESS_TOKEN in .env.local.",
    );
  }

  return {
    appKey: env.LONGBRIDGE_APP_KEY,
    appSecret: env.LONGBRIDGE_APP_SECRET,
    accessToken: env.LONGBRIDGE_ACCESS_TOKEN,
    language: env.LONGBRIDGE_LANGUAGE ? toLongbridgeLanguage(env.LONGBRIDGE_LANGUAGE) : undefined,
  };
}

function toLongbridgeLanguage(language: "zh-CN" | "zh-HK" | "en") {
  const languageMap = {
    "zh-CN": 0,
    "zh-HK": 1,
    en: 2,
  } as const;

  return languageMap[language] as Language;
}
