/**
 * Binance API 签名与基本请求工具
 */

import crypto from "crypto";

export interface BinanceTrade {
  symbol: string;
  id: number;
  orderId: number;
  orderListId: number;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  isMaker: boolean;
  isBestMatch: boolean;
}

/**
 * 为 Binance API 生成签名 (HMAC SHA256)
 */
export function generateSignature(queryString: string, apiSecret: string): string {
  return crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");
}

/**
 * 通用的 Binance 已鉴权请求 (REST API)
 */
export async function binanceAuthenticatedFetch<T>(
  endpoint: string,
  apiKey: string,
  apiSecret: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  const timestamp = Date.now();
  const queryParams = new URLSearchParams({
    ...params,
    timestamp: timestamp.toString(),
  } as Record<string, string>);

  const signature = generateSignature(queryParams.toString(), apiSecret);
  queryParams.append("signature", signature);

  const url = `https://api.binance.com${endpoint}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      "X-MBX-APIKEY": apiKey,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || "Binance API 请求失败");
  }

  return response.json();
}
