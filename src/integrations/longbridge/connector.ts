import type { LongbridgeSyncPayload } from "./types";

export class LongbridgeConnector {
  async syncReadOnly(): Promise<LongbridgeSyncPayload> {
    return {
      accountBalances: [],
      positions: [],
      executions: [],
    };
  }

  submitOrder(): never {
    throw new Error("TradeLens MVP is read-only and does not support order submission.");
  }

  cancelOrder(): never {
    throw new Error("TradeLens MVP is read-only and does not support order cancellation.");
  }
}
