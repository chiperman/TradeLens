/**
 * Binance 交易所适配器
 *
 * 基于现有 src/lib/binance.ts 签名逻辑，实现统一适配器接口。
 */

import {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";
import { ExchangeHttpClient, SigningStrategies } from "./base/exchange-client";

interface BinanceRawTrade {
  symbol: string;
  id: number;
  orderId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
}

interface BinanceDepositRecord {
  amount: string;
  coin: string;
  status: number;
  txId: string;
  insertTime: number;
}

interface BinanceWithdrawRecord {
  amount: string;
  coin: string;
  status: number;
  txId: string;
  applyTime: string;
}

interface BinanceBalance {
  asset: string;
  free: string;
  locked: string;
}

export class BinanceAdapter implements ExchangeAdapter {
  readonly name = "binance" as const;
  private client: ExchangeHttpClient;

  constructor() {
    this.client = new ExchangeHttpClient({
      baseUrl: "https://api.binance.com",
      signingStrategy: SigningStrategies.binance,
      signatureLocation: "query",
      signatureHeader: "signature", // Not really used in query mode but required by interface
      apiKeyHeader: "X-MBX-APIKEY",
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
        const account = await this.fetch<{
          balances: BinanceBalance[];
        }>("/api/v3/account", creds);
        // 找出有余额的资产，并生成常见的 USDT 交易对
        symbols = (account.balances || [])
          .filter((b: BinanceBalance) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .filter((b: BinanceBalance) => b.asset !== "USDT" && b.asset !== "FDUSD") // 排除计价货币
          .map((b: BinanceBalance) => `${b.asset}USDT`);

        // 加上一些主流交易对作为兜底
        if (!symbols || symbols.length === 0) {
          symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
        }
      } catch (e) {
        console.error("Failed to fetch symbols from Binance account, falling back to defaults", e);
        symbols = ["BTCUSDT", "ETHUSDT"];
      }
    }

    const allTrades: NormalizedTrade[] = [];

    for (const symbol of symbols!) {
      try {
        const apiParams: Record<string, string | number> = { symbol, limit: 1000 };
        if (params.startTime) apiParams.startTime = params.startTime;
        if (params.endTime) apiParams.endTime = params.endTime;

        const raw = await this.fetch<BinanceRawTrade[]>("/api/v3/myTrades", creds, apiParams);

        const mapped = (raw || []).map((t: BinanceRawTrade) => ({
          symbol: t.symbol,
          assetClass: "crypto" as const,
          exchange: "binance" as const,
          side: (t.isBuyer ? "BUY" : "SELL") as "BUY" | "SELL",
          price: parseFloat(t.price),
          quantity: parseFloat(t.qty),
          quoteQuantity: parseFloat(t.quoteQty),
          commission: parseFloat(t.commission),
          commissionAsset: t.commissionAsset,
          externalTradeId: String(t.id),
          externalOrderId: String(t.orderId),
          transactedAt: new Date(t.time),
        }));

        allTrades.push(...mapped);
      } catch (err) {
        // 部分交易对可能不存在（例如生成的 XXXUSDT 可能并不是有效交易对）
        console.warn(`Failed to fetch trades for ${symbol} on Binance`, err);
      }
    }

    return allTrades;
  }

  async fetchDeposits(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await this.fetch<BinanceDepositRecord[]>("/sapi/v1/capital/deposit/hisrec", creds);

    return (raw || []).map((d: BinanceDepositRecord) => ({
      exchange: "binance" as const,
      direction: "deposit" as const,
      amount: parseFloat(d.amount),
      currency: d.coin,
      txId: d.txId,
      transactedAt: new Date(d.insertTime),
    }));
  }

  async fetchWithdrawals(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await this.fetch<BinanceWithdrawRecord[]>(
      "/sapi/v1/capital/withdraw/history",
      creds
    );

    return (raw || []).map((w: BinanceWithdrawRecord) => ({
      exchange: "binance" as const,
      direction: "withdrawal" as const,
      amount: parseFloat(w.amount),
      currency: w.coin,
      txId: w.txId,
      transactedAt: new Date(w.applyTime),
    }));
  }

  async testConnection(creds: ExchangeCredentials): Promise<boolean> {
    try {
      await this.fetch("/api/v3/account", creds);
      return true;
    } catch {
      return false;
    }
  }
}
