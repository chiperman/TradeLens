/**
 * Longbridge 交易所适配器 (骨架)
 *
 * Longbridge 使用 OAuth 2.0 认证，完整实现需要 OAuth 流程。
 * 当前版本仅提供接口占位，后续迭代中完善。
 */

import type {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";

export class LongbridgeAdapter implements ExchangeAdapter {
  readonly name = "longbridge" as const;

  async fetchTrades(_creds: ExchangeCredentials, _params: SyncParams): Promise<NormalizedTrade[]> {
    // TODO: Phase 3+ 实现 OAuth 认证后完善
    throw new Error("Longbridge 适配器尚未完全实现，需先完成 OAuth 授权流程");
  }

  async fetchDeposits(_creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    throw new Error("Longbridge 适配器尚未完全实现，需先完成 OAuth 授权流程");
  }

  async fetchWithdrawals(_creds: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    throw new Error("Longbridge 适配器尚未完全实现，需先完成 OAuth 授权流程");
  }

  async testConnection(_creds: ExchangeCredentials): Promise<boolean> {
    // Longbridge 需要 OAuth Token，暂时返回 false
    return false;
  }
}
