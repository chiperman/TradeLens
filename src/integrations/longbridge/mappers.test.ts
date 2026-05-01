import { describe, expect, it } from "vitest";
import { mapAccountBalance, mapExecution, mapStockPosition, mapStockPositions } from "./mappers";

const decimal = (value: string) => ({ toString: () => value });

describe("longbridge mappers", () => {
  it("maps account balances", () => {
    const accountBalance = {
      netAssets: decimal("12500.50"),
      totalCash: decimal("2500.25"),
      buyPower: decimal("5000"),
      currency: "USD",
    };

    expect(mapAccountBalance(accountBalance as never)).toEqual({
      netAssets: "12500.50",
      totalCash: "2500.25",
      buyPower: "5000",
      currency: "USD",
      raw: accountBalance,
    });
  });

  it("maps stock position responses", () => {
    const position = {
      symbol: "AAPL.US",
      symbolName: "Apple",
      market: 1,
      quantity: decimal("10"),
      availableQuantity: decimal("8"),
      costPrice: decimal("150.12"),
      currency: "USD",
    };
    const response = {
      channels: [
        {
          accountChannel: "standard",
          positions: [position],
        },
      ],
    };

    expect(mapStockPositions(response as never)).toEqual([
      {
        symbol: "AAPL.US",
        name: "Apple",
        market: "US",
        quantity: "10",
        availableQuantity: "8",
        costPrice: "150.12",
        currency: "USD",
        raw: position,
      },
    ]);
  });

  it("maps unknown stock markets", () => {
    const position = {
      symbol: "0000.UNKNOWN",
      symbolName: "Unknown",
      market: 0,
      quantity: decimal("1"),
      availableQuantity: decimal("1"),
      costPrice: decimal("1"),
      currency: "USD",
    };

    expect(mapStockPosition(position as never).market).toBe("UNKNOWN");
  });

  it("maps executions", () => {
    const executedAt = new Date("2026-05-02T00:00:00.000Z");
    const execution = {
      tradeId: "trade-1",
      orderId: "order-1",
      symbol: "700.HK",
      quantity: decimal("100"),
      price: decimal("320.5"),
      tradeDoneAt: executedAt,
    };

    expect(mapExecution(execution as never)).toEqual({
      externalId: "trade-1",
      orderId: "order-1",
      symbol: "700.HK",
      quantity: "100",
      price: "320.5",
      executedAt,
      raw: execution,
    });
  });
});
