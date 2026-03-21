export type OptionType = "CALL" | "PUT";
export type OptionStatus = "OPEN" | "CLOSED" | "EXERCISED" | "EXPIRED";

export interface OptionPosition {
  id: string;
  user_id: string;
  underlying_symbol: string;
  option_type: OptionType;
  strike_price: number;
  expiry_date: string; // ISO Date String
  premium: number; // 单个合约平均价格
  contracts: number; // 数量 (始终为正，通过 side 判断开仓方向, 或者我们可以认为正的是 buy to open, 负的是 sell to open? 不，这里只记开仓，多头仓单)
  multiplier: number; // 通常 100
  status: OptionStatus;
  close_premium?: number | null;
  greeks?: Record<string, number> | null;
  notes?: string | null;
  opened_at: string;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type OptionInsertParams = Omit<
  OptionPosition,
  | "id"
  | "user_id"
  | "status"
  | "close_premium"
  | "closed_at"
  | "created_at"
  | "updated_at"
  | "opened_at"
>;

export type OptionUpdateParams = Partial<
  Pick<
    OptionPosition,
    "status" | "close_premium" | "notes" | "greeks" | "closed_at" | "contracts" | "premium"
  >
>;
