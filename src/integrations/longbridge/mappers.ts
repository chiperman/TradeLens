import type { AccountBalance, Execution, StockPosition, StockPositionsResponse } from "longbridge";
import type {
  NormalizedLongbridgeAccount,
  NormalizedLongbridgeExecution,
  NormalizedLongbridgePosition,
} from "./types";

export function mapAccountBalance(accountBalance: AccountBalance): NormalizedLongbridgeAccount {
  return {
    netAssets: accountBalance.netAssets.toString(),
    totalCash: accountBalance.totalCash.toString(),
    buyPower: accountBalance.buyPower.toString(),
    currency: accountBalance.currency,
    raw: accountBalance,
  };
}

export function mapStockPositions(
  stockPositionsResponse: StockPositionsResponse,
): NormalizedLongbridgePosition[] {
  return stockPositionsResponse.channels.flatMap((channel) =>
    channel.positions.map((position) => mapStockPosition(position)),
  );
}

export function mapStockPosition(position: StockPosition): NormalizedLongbridgePosition {
  return {
    symbol: position.symbol,
    name: position.symbolName,
    market: mapMarket(position.market),
    quantity: position.quantity.toString(),
    availableQuantity: position.availableQuantity.toString(),
    costPrice: position.costPrice.toString(),
    currency: position.currency,
    raw: position,
  };
}

export function mapExecution(execution: Execution): NormalizedLongbridgeExecution {
  return {
    externalId: execution.tradeId,
    orderId: execution.orderId,
    symbol: execution.symbol,
    quantity: execution.quantity.toString(),
    price: execution.price.toString(),
    executedAt: execution.tradeDoneAt,
    raw: execution,
  };
}

function mapMarket(market: number) {
  const marketMap: Record<number, string> = {
    1: "US",
    2: "HK",
    3: "CN",
    4: "SG",
    5: "CRYPTO",
  };

  return marketMap[market] ?? "UNKNOWN";
}
