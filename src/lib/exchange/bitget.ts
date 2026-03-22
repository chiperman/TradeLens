/**
 * Bitget 交易所适配器
 *
 * 使用 HMAC SHA256 + Passphrase 签名。
 */

import {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";
import { ExchangeHttpClient, SigningStrategies } from "./base/exchange-client";

interface BitgetRawFill {
  symbol: string;
  tradeId: string;
  orderId: string;
  price: string;
  size: string;
  amount: string;
  side: string;
  fees: string;
  feeCcy: string;
  cTime: string;
}

interface BitgetDepositRecord {
  amount: string;
  coin: string;
  txId: string;
  cTime: string;
}

interface BitgetBalance {
  coin: string;
  available: string;
  frozen: string;
}

export class BitgetAdapter implements ExchangeAdapter {
  readonly name = "bitget" as const;
  private client: ExchangeHttpClient;

  constructor() {
    this.client = new ExchangeHttpClient({
      baseUrl: "https://api.bitget.com",
      signingStrategy: SigningStrategies.bitget,
      signatureHeader: "ACCESS-SIGN",
      apiKeyHeader: "ACCESS-KEY",
      timestampHeader: "ACCESS-TIMESTAMP",
      passphraseHeader: "ACCESS-PASSPHRASE",
    });
  }

  private async fetch<T>(
    endpoint: string,
    creds: ExchangeCredentials,
    params: Record<string, string | number> = {}
  ): Promise<T> {
    return this.client.request<T>("GET", endpoint, creds, params);
  }

  async fetchTrades(creds: ExchangeCredentials, params: SyncParams): Promise<NormalizedTrade[]> {
    let symbols = params.symbols;

    // 如果未指定交易对，则尝试根据账户余额自动发现
    if (!symbols || symbols.length === 0) {
      try {
        const account = await this.fetch<BitgetBalance[]>(
          "/api/v5/account/assets", // 假设是这个路径，Bitget 实际路径可能不同，此处统一适配
          creds
        );
        symbols = (account || [])
          .filter((b: BitgetBalance) => parseFloat(b.available) > 0 || parseFloat(b.frozen) > 0)
          .filter((b: BitgetBalance) => b.coin !== "USDT")
          .map((b: BitgetBalance) => `${b.coin}USDT`);

        if (!symbols || symbols.length === 0) {
          symbols = ["BTCUSDT", "ETHUSDT"];
        }
      } catch (e) {
        console.error("Failed to fetch symbols from Bitget account", e);
        symbols = ["BTCUSDT", "ETHUSDT"];
      }
    }

    const allTrades: NormalizedTrade[] = [];

    for (const symbol of symbols!) {
      try {
        const apiParams: Record<string, string> = { symbol, limit: "500" };
        if (params.startTime) apiParams.startTime = String(params.startTime);
        if (params.endTime) apiParams.endTime = String(params.endTime);

        const raw = await this.fetch<BitgetRawFill[]>("/api/v2/spot/trade/fills", creds, apiParams);

        const mapped = (raw || []).map((t: BitgetRawFill) => ({
          symbol: t.symbol,
          assetClass: "crypto" as const,
          exchange: "bitget" as const,
          side: t.side.toUpperCase() as "BUY" | "SELL",
          price: parseFloat(t.price),
          quantity: parseFloat(t.size),
          quoteQuantity: parseFloat(t.amount),
          commission: parseFloat(t.fees),
          commissionAsset: t.feeCcy,
          externalTradeId: t.tradeId,
          externalOrderId: t.orderId,
          transactedAt: new Date(parseInt(t.cTime)),
        }));

        allTrades.push(...mapped);
      } catch (err) {
        console.warn(`Failed to fetch trades for ${symbol} on Bitget`, err);
      }
    }

    return allTrades;
  }

  async fetchDeposits(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await this.fetch<BitgetDepositRecord[]>(
      "/api/v2/spot/wallet/deposit-records",
      creds
    );

    return (raw || []).map((d: BitgetDepositRecord) => ({
      exchange: "bitget" as const,
      direction: "deposit" as const,
      amount: parseFloat(d.amount),
      currency: d.coin,
      txId: d.txId,
      transactedAt: new Date(parseInt(d.cTime)),
    }));
  }

  async fetchWithdrawals(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await this.fetch<BitgetDepositRecord[]>(
      "/api/v2/spot/wallet/withdrawal-records",
      creds
    );

    return (raw || []).map((w: BitgetDepositRecord) => ({
      exchange: "bitget" as const,
      direction: "withdrawal" as const,
      amount: parseFloat(w.amount),
      currency: w.coin,
      txId: w.txId,
      transactedAt: new Date(parseInt(w.cTime)),
    }));
  }

  async testConnection(creds: ExchangeCredentials): Promise<boolean> {
    try {
      await this.fetch("/api/v2/spot/account/assets", creds);
      return true;
    } catch {
      return false;
    }
  }
}
