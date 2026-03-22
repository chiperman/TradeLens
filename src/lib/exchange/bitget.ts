/**
 * Bitget 交易所适配器
 *
 * 使用 HMAC SHA256 + Passphrase 签名。
 */

import crypto from "crypto";
import type {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";

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

function signBitget(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): string {
  const preHash = timestamp + method.toUpperCase() + requestPath + body;
  return crypto.createHmac("sha256", secretKey).update(preHash).digest("base64");
}

async function authFetch<T>(
  method: string,
  path: string,
  creds: ExchangeCredentials,
  params: Record<string, string> = {}
): Promise<T> {
  const timestamp = Date.now().toString();
  const qs = new URLSearchParams(params).toString();
  const fullPath = qs ? `${path}?${qs}` : path;
  const signature = signBitget(timestamp, method, fullPath, "", creds.apiSecret!);

  const url = `https://api.bitget.com${fullPath}`;
  const res = await fetch(url, {
    method,
    headers: {
      "ACCESS-KEY": creds.apiKey!,
      "ACCESS-SIGN": signature,
      "ACCESS-TIMESTAMP": timestamp,
      "ACCESS-PASSPHRASE": creds.passphrase!,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.msg || `Bitget API ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}

export class BitgetAdapter implements ExchangeAdapter {
  readonly name = "bitget" as const;

  async fetchTrades(creds: ExchangeCredentials, params: SyncParams): Promise<NormalizedTrade[]> {
    let symbols = params.symbols;

    // 如果未指定交易对，尝试根据账户余额自动发现
    if (!symbols || symbols.length === 0) {
      try {
        const assets = await authFetch<{ coin: string; available: string; frozen: string }[]>(
          "GET",
          "/api/v2/spot/account/assets",
          creds
        );
        symbols = (assets || [])
          .filter((a) => parseFloat(a.available) > 0 || parseFloat(a.frozen) > 0)
          .filter((a) => a.coin !== "USDT" && a.coin !== "USDC")
          .map((a) => `${a.coin}USDT`);

        if (symbols.length === 0) {
          symbols = ["BTCUSDT", "ETHUSDT"];
        }
      } catch (e) {
        console.error("Failed to fetch symbols from Bitget account", e);
        symbols = ["BTCUSDT", "ETHUSDT"];
      }
    }

    const allTrades: NormalizedTrade[] = [];

    for (const symbol of symbols) {
      try {
        const apiParams: Record<string, string> = { symbol, limit: "500" };
        if (params.startTime) apiParams.startTime = String(params.startTime);
        if (params.endTime) apiParams.endTime = String(params.endTime);

        const raw = await authFetch<BitgetRawFill[]>(
          "GET",
          "/api/v2/spot/trade/fills",
          creds,
          apiParams
        );

        const mapped = (raw || []).map((t) => ({
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
    const raw = await authFetch<BitgetDepositRecord[]>(
      "GET",
      "/api/v2/spot/wallet/deposit-records",
      creds
    );

    return (raw || []).map((d) => ({
      exchange: "bitget" as const,
      direction: "deposit" as const,
      amount: parseFloat(d.amount),
      currency: d.coin,
      txId: d.txId,
      transactedAt: new Date(parseInt(d.cTime)),
    }));
  }

  async fetchWithdrawals(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await authFetch<BitgetDepositRecord[]>(
      "GET",
      "/api/v2/spot/wallet/withdrawal-records",
      creds
    );

    return (raw || []).map((w) => ({
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
      await authFetch("GET", "/api/v2/spot/account/assets", creds);
      return true;
    } catch {
      return false;
    }
  }
}
