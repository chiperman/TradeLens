/**
 * OKX 交易所适配器
 *
 * 使用 HMAC SHA256 + Passphrase 签名，signature 输出 Base64。
 */

import type {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";
import { ExchangeHttpClient, SigningStrategies } from "./base/exchange-client";

interface OkxRawFill {
  instId: string;
  tradeId: string;
  ordId: string;
  side: string;
  fillPx: string;
  fillSz: string;
  fee: string;
  feeCcy: string;
  ts: string;
}

interface OkxDepositRecord {
  amt: string;
  ccy: string;
  txId: string;
  ts: string;
}

export class OkxAdapter implements ExchangeAdapter {
  readonly name = "okx" as const;
  private client: ExchangeHttpClient;

  constructor() {
    this.client = new ExchangeHttpClient({
      baseUrl: "https://www.okx.com",
      signingStrategy: SigningStrategies.okx,
      signatureHeader: "OK-ACCESS-SIGN",
      apiKeyHeader: "OK-ACCESS-KEY",
      timestampHeader: "OK-ACCESS-TIMESTAMP",
      passphraseHeader: "OK-ACCESS-PASSPHRASE",
      headers: { "Content-Type": "application/json" },
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
    const apiParams: Record<string, string | number> = { instType: "SPOT" };
    if (params.startTime) apiParams.begin = String(params.startTime);
    if (params.endTime) apiParams.end = String(params.endTime);

    const raw = await this.fetch<OkxRawFill[]>("/api/v5/trade/fills-history", creds, apiParams);

    return (raw || []).map((t: OkxRawFill) => ({
      symbol: t.instId,
      assetClass: "crypto" as const,
      exchange: "okx" as const,
      side: t.side.toUpperCase() as "BUY" | "SELL",
      price: parseFloat(t.fillPx),
      quantity: parseFloat(t.fillSz),
      quoteQuantity: parseFloat(t.fillPx) * parseFloat(t.fillSz),
      commission: Math.abs(parseFloat(t.fee)),
      commissionAsset: t.feeCcy,
      externalTradeId: t.tradeId,
      externalOrderId: t.ordId,
      transactedAt: new Date(parseInt(t.ts)),
    }));
  }

  async fetchDeposits(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await this.fetch<OkxDepositRecord[]>("/api/v5/asset/deposit-history", creds);

    return (raw || []).map((d: OkxDepositRecord) => ({
      exchange: "okx" as const,
      direction: "deposit" as const,
      amount: parseFloat(d.amt),
      currency: d.ccy,
      txId: d.txId,
      transactedAt: new Date(parseInt(d.ts)),
    }));
  }

  async fetchWithdrawals(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await this.fetch<OkxDepositRecord[]>("/api/v5/asset/withdrawal-history", creds);

    return (raw || []).map((w: OkxDepositRecord) => ({
      exchange: "okx" as const,
      direction: "withdrawal" as const,
      amount: parseFloat(w.amt),
      currency: w.ccy,
      txId: w.txId,
      transactedAt: new Date(parseInt(w.ts)),
    }));
  }

  async testConnection(creds: ExchangeCredentials): Promise<boolean> {
    try {
      await this.fetch("/api/v5/account/balance", creds);
      return true;
    } catch {
      return false;
    }
  }
}
