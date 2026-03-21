/**
 * TradeLens V2 — 交易记录与资金流水类型定义
 */

// ============================================================
// 枚举常量
// ============================================================

export const ASSET_CLASSES = ['us_stock', 'hk_stock', 'crypto'] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

export const EXCHANGES = ['longbridge', 'binance', 'bitget', 'okx'] as const;
export type Exchange = (typeof EXCHANGES)[number];

export const TRADE_SIDES = ['BUY', 'SELL'] as const;
export type TradeSide = (typeof TRADE_SIDES)[number];

export const DATA_SOURCES = ['auto', 'manual', 'import'] as const;
export type DataSource = (typeof DATA_SOURCES)[number];

export const FUND_DIRECTIONS = ['deposit', 'withdrawal'] as const;
export type FundDirection = (typeof FUND_DIRECTIONS)[number];

// ============================================================
// 数据库行类型
// ============================================================

export interface Transaction {
  id: string;
  user_id: string;
  symbol: string;
  asset_name: string | null;
  asset_class: AssetClass;
  market: string | null;
  exchange: string;
  side: TradeSide;
  price: number;
  quantity: number;
  quote_quantity: number;
  commission: number;
  commission_asset: string | null;
  commission_currency: string;
  source: DataSource;
  external_trade_id: string | null;
  external_order_id: string | null;
  custom_fee_override: Record<string, unknown> | null;
  notes: string | null;
  transacted_at: string;
  created_at: string;
}

export interface FundFlow {
  id: string;
  user_id: string;
  exchange: Exchange;
  direction: FundDirection;
  amount: number;
  currency: string;
  notes: string | null;
  transacted_at: string;
  created_at: string;
}

// ============================================================
// 表单数据类型
// ============================================================

export interface TransactionFormData {
  symbol: string;
  asset_name?: string;
  asset_class: AssetClass;
  market?: string;
  exchange: string;
  side: TradeSide;
  price: number;
  quantity: number;
  commission?: number;
  commission_currency?: string;
  notes?: string;
  transacted_at: string;
}

export interface FundFlowFormData {
  exchange: Exchange;
  direction: FundDirection;
  amount: number;
  currency: string;
  notes?: string;
  transacted_at: string;
}

// ============================================================
// 筛选与分页
// ============================================================

export interface TransactionFilter {
  asset_class?: AssetClass;
  exchange?: string;
  side?: TradeSide;
  source?: DataSource;
  symbol?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  column: string;
  direction: SortDirection;
}

// ============================================================
// 展示辅助
// ============================================================

export const ASSET_CLASS_LABELS: Record<AssetClass, { zh: string; en: string }> = {
  us_stock: { zh: '美股', en: 'US Stock' },
  hk_stock: { zh: '港股', en: 'HK Stock' },
  crypto: { zh: '加密货币', en: 'Crypto' },
};

export const EXCHANGE_LABELS: Record<string, string> = {
  longbridge: 'Longbridge',
  binance: 'Binance',
  bitget: 'Bitget',
  okx: 'OKX',
};
