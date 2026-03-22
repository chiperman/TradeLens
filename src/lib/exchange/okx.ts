/**
 * OKX 交易所适配器
 *
 * 使用 HMAC SHA256 + Passphrase 签名，signature 输出 Base64。
 */

import crypto from "crypto";
import type {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";

interface OkxRawFill {
  instId: string;
  tradeId: string;
  ordId: string;
  fillPx: string;
  fillSz: string;
  side: string;
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

function signOkx(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): string {
  const preHash = timestamp + method.toUpperCase() + requestPath + (body || "");
  return crypto.createHmac("sha256", secretKey).update(preHash).digest("base64");
}

async function authFetch<T>(
  method: string,
  path: string,
  creds: ExchangeCredentials,
  params: Record<string, string> = {}
): Promise<T> {
  const timestamp = new Date().toISOString();
  const qs = new URLSearchParams(params).toString();
  const fullPath = qs ? `${path}?${qs}` : path;
  const signature = signOkx(timestamp, method, fullPath, "", creds.apiSecret!);

  const url = `https://www.okx.com${fullPath}`;
  const response = await fetch(url.toString(), {
    method,
    headers: {
      "OK-ACCESS-KEY": creds.apiKey!,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": creds.passphrase!,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.msg || `OKX API ${response.status}`);
  }
  const json = await response.json();
  return json.data as T;
}

export class OkxAdapter implements ExchangeAdapter {
  readonly name = "okx" as const;

  async fetchTrades(creds: ExchangeCredentials, params: SyncParams): Promise<NormalizedTrade[]> {
    const apiParams: Record<string, string> = { instType: "SPOT" };
    if (params.startTime) apiParams.begin = String(params.startTime);
    if (params.endTime) apiParams.end = String(params.endTime);

    const raw = await authFetch<OkxRawFill[]>(
      "GET",
      "/api/v5/trade/fills-history",
      creds,
      apiParams
    );

    return (raw || []).map((t) => ({
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
    const raw = await authFetch<OkxDepositRecord[]>("GET", "/api/v5/asset/deposit-history", creds);

    return (raw || []).map((d) => ({
      exchange: "okx" as const,
      direction: "deposit" as const,
      amount: parseFloat(d.amt),
      currency: d.ccy,
      txId: d.txId,
      transactedAt: new Date(parseInt(d.ts)),
    }));
  }

  async fetchWithdrawals(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await authFetch<OkxDepositRecord[]>(
      "GET",
      "/api/v5/asset/withdrawal-history",
      creds
    );

    return (raw || []).map((w) => ({
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
      await authFetch("GET", "/api/v5/account/balance", creds);
      return true;
    } catch {
      return false;
    }
  }
}
