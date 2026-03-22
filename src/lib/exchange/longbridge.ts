import type {
  ExchangeAdapter,
  ExchangeCredentials,
  NormalizedTrade,
  NormalizedFundFlow,
  SyncParams,
} from "./types";
import { getValidLongbridgeToken } from "./longbridge-auth";

const LONGBRIDGE_API_BASE = "https://openapi.longbridgeapp.com";

interface LongbridgeTradeItem {
  symbol: string;
  side: string;
  executed_price: string;
  executed_quantity: string;
  fee?: string;
  execution_id: string;
  order_id: string;
  executed_at: string;
}

interface LongbridgeFundItem {
  business: string;
  balance_change: string;
  currency: string;
  cash_flow_id: string;
  executed_at: string;
}

export class LongbridgeAdapter implements ExchangeAdapter {
  readonly name = "longbridge" as const;

  private async getAccessToken(credentials: ExchangeCredentials): Promise<string> {
    if (credentials.userId) {
      return await getValidLongbridgeToken(credentials.userId);
    }
    if (credentials.accessToken) {
      return credentials.accessToken;
    }
    throw new Error("Longbridge Access Token is required. Please reconnect your account.");
  }

  async fetchTrades(
    credentials: ExchangeCredentials,
    params: SyncParams
  ): Promise<NormalizedTrade[]> {
    const token = await this.getAccessToken(credentials);

    const url = new URL(`${LONGBRIDGE_API_BASE}/v1/trade/execution/history`);
    if (params.startTime) {
      url.searchParams.append("start_at", Math.floor(params.startTime / 1000).toString());
    }
    if (params.endTime) {
      url.searchParams.append("end_at", Math.floor(params.endTime / 1000).toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Longbridge API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const list = (data.data?.list || []) as LongbridgeTradeItem[];

    return list.map((item) => ({
      symbol: item.symbol,
      assetClass: this.inferAssetClass(item.symbol),
      market: item.symbol.split(".")[1],
      exchange: this.name,
      side: item.side === "Buy" ? "BUY" : "SELL",
      price: parseFloat(item.executed_price),
      quantity: parseFloat(item.executed_quantity),
      quoteQuantity: parseFloat(item.executed_price) * parseFloat(item.executed_quantity),
      commission: parseFloat(item.fee || "0"),
      commissionAsset: "USD", // Longbridge typically uses USD for US stocks, HKD for HK stocks. Simplified for now.
      externalTradeId: item.execution_id,
      externalOrderId: item.order_id,
      transactedAt: new Date(parseInt(item.executed_at) * 1000),
    }));
  }

  async fetchDeposits(credentials: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    return this.fetchFundFlows(credentials, "deposit");
  }

  async fetchWithdrawals(credentials: ExchangeCredentials): Promise<NormalizedFundFlow[]> {
    return this.fetchFundFlows(credentials, "withdrawal");
  }

  private async fetchFundFlows(
    credentials: ExchangeCredentials,
    direction: "deposit" | "withdrawal"
  ): Promise<NormalizedFundFlow[]> {
    const token = await this.getAccessToken(credentials);

    // NOTE: Longbridge uses /v1/asset/cash_flow for all fund movements
    const url = new URL(`${LONGBRIDGE_API_BASE}/v1/asset/cash_flow`);
    // Filter by type could be added here if known.

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Longbridge API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const list = (data.data?.list || []) as LongbridgeFundItem[];

    return list
      .filter((item) => {
        // Map Longbridge cash flow types to our deposit/withdrawal
        if (direction === "deposit") return item.business === "Deposit";
        if (direction === "withdrawal") return item.business === "Withdrawal";
        return false;
      })
      .map((item) => ({
        exchange: this.name,
        direction,
        amount: Math.abs(parseFloat(item.balance_change)),
        currency: item.currency,
        txId: item.cash_flow_id,
        transactedAt: new Date(parseInt(item.executed_at) * 1000),
      }));
  }

  async testConnection(credentials: ExchangeCredentials): Promise<boolean> {
    try {
      const token = await this.getAccessToken(credentials);
      const response = await fetch(`${LONGBRIDGE_API_BASE}/v1/asset/account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private inferAssetClass(symbol: string): "us_stock" | "hk_stock" | "crypto" {
    if (symbol.endsWith(".US")) return "us_stock";
    if (symbol.endsWith(".HK")) return "hk_stock";
    return "us_stock"; // Default
  }
}
