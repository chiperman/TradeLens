/**
 * Binance 交易所适配器
 *
 * 基于现有 src/lib/binance.ts 签名逻辑，实现统一适配器接口。
 */

import crypto from "crypto";
import type {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";

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

function sign(queryString: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(queryString).digest("hex");
}

async function authFetch<T>(
  endpoint: string,
  creds: ExchangeCredentials,
  params: Record<string, string | number> = {}
): Promise<T> {
  const timestamp = Date.now();
  const qs = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    timestamp: timestamp.toString(),
  });
  qs.append("signature", sign(qs.toString(), creds.apiSecret!));

  const url = `https://api.binance.com${endpoint}?${qs.toString()}`;
  const response = await fetch(url, {
    headers: { "X-MBX-APIKEY": creds.apiKey! },
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.msg || `Binance API ${response.status}`);
  }
  return response.json();
}

export class BinanceAdapter implements ExchangeAdapter {
  readonly name = "binance" as const;

  async fetchTrades(creds: ExchangeCredentials, params: SyncParams): Promise<NormalizedTrade[]> {
    let symbols = params.symbols;

    // 如果未指定交易对，则尝试根据账户余额自动发现
    if (!symbols || symbols.length === 0) {
      try {
        const account = await authFetch<{
          balances: { asset: string; free: string; locked: string }[];
        }>("/api/v3/account", creds);
        // 找出有余额的资产，并生成常见的 USDT 交易对
        symbols = account.balances
          .filter((b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
          .filter((b) => b.asset !== "USDT" && b.asset !== "FDUSD") // 排除计价货币
          .map((b) => `${b.asset}USDT`);

        // 加上一些主流交易对作为兜底
        if (symbols.length === 0) {
          symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
        }
      } catch (e) {
        console.error("Failed to fetch symbols from Binance account, falling back to defaults", e);
        symbols = ["BTCUSDT", "ETHUSDT"];
      }
    }

    const allTrades: NormalizedTrade[] = [];

    for (const symbol of symbols) {
      try {
        const apiParams: Record<string, string | number> = { symbol, limit: 1000 };
        if (params.startTime) apiParams.startTime = params.startTime;
        if (params.endTime) apiParams.endTime = params.endTime;

        const raw = await authFetch<BinanceRawTrade[]>("/api/v3/myTrades", creds, apiParams);

        const mapped = raw.map((t) => ({
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
    const raw = await authFetch<BinanceDepositRecord[]>("/sapi/v1/capital/deposit/hisrec", creds);

    return raw.map((d) => ({
      exchange: "binance" as const,
      direction: "deposit" as const,
      amount: parseFloat(d.amount),
      currency: d.coin,
      txId: d.txId,
      transactedAt: new Date(d.insertTime),
    }));
  }

  async fetchWithdrawals(creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    const raw = await authFetch<BinanceWithdrawRecord[]>(
      "/sapi/v1/capital/withdraw/history",
      creds
    );

    return raw.map((w) => ({
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
      await authFetch("/api/v3/account", creds);
      return true;
    } catch {
      return false;
    }
  }
}
