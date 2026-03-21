/**
 * 统一交易所数据类型定义
 *
 * 所有交易所的原始数据格式不同，此文件定义了统一的内部类型，
 * 以便上层逻辑无需关心具体交易所的差异。
 */

// ============================================================
// 统一交易记录
// ============================================================

export interface NormalizedTrade {
  symbol: string;
  assetClass: "us_stock" | "hk_stock" | "crypto";
  market?: string;
  exchange: ExchangeName;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  quoteQuantity: number;
  commission: number;
  commissionAsset: string;
  externalTradeId: string;
  externalOrderId?: string;
  transactedAt: Date;
}

// ============================================================
// 统一资金流水
// ============================================================

export interface NormalizedFundFlow {
  exchange: ExchangeName;
  direction: "deposit" | "withdrawal";
  amount: number;
  currency: string;
  txId?: string;
  transactedAt: Date;
}

// ============================================================
// 实时行情
// ============================================================

export interface QuoteUpdate {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  timestamp: Date;
}

// ============================================================
// 同步参数与结果
// ============================================================

export interface SyncParams {
  /** 增量同步起始时间 (毫秒时间戳) */
  startTime?: number;
  /** 同步截止时间 (毫秒时间戳) */
  endTime?: number;
  /** 指定交易对/标的列表 (如 ['BTCUSDT', 'ETHUSDT']) */
  symbols?: string[];
}

export interface SyncResult {
  exchange: ExchangeName;
  tradesCount: number;
  depositsCount: number;
  withdrawalsCount: number;
  errors: string[];
}

// ============================================================
// 交易所名称枚举
// ============================================================

export type ExchangeName = "longbridge" | "binance" | "bitget" | "okx";

export const EXCHANGE_NAMES: ExchangeName[] = ["longbridge", "binance", "bitget", "okx"];

export const EXCHANGE_LABELS: Record<ExchangeName, string> = {
  longbridge: "Longbridge (长桥)",
  binance: "Binance (币安)",
  bitget: "Bitget",
  okx: "OKX",
};

// ============================================================
// 交易所适配器接口
// ============================================================

export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // Bitget / OKX
}

export interface ExchangeAdapter {
  readonly name: ExchangeName;

  /** 拉取交易记录 */
  fetchTrades(credentials: ExchangeCredentials, params: SyncParams): Promise<NormalizedTrade[]>;

  /** 拉取充值记录 */
  fetchDeposits(credentials: ExchangeCredentials): Promise<NormalizedFundFlow[]>;

  /** 拉取提现记录 */
  fetchWithdrawals(credentials: ExchangeCredentials): Promise<NormalizedFundFlow[]>;

  /** 测试连接有效性 */
  testConnection(credentials: ExchangeCredentials): Promise<boolean>;
}
