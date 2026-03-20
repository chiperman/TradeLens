import { describe, it, expect } from "vitest";
import { calculateBreakEven, calculateNetProfit } from "./calculator";

describe("Trade Calculator Logic", () => {
  it("应当准确计算保本价 (考虑双向手续费)", () => {
    const params = {
      buyPrice: 60000,
      quantity: 1,
      makerFeeRate: 0.001, // 0.1%
      takerFeeRate: 0.001, // 0.1%
    };

    // 买入成本: 60000 + (60000 * 0.001) = 60060
    // 卖出保本: 60060 / (1 * (1 - 0.001)) = 60120.12
    const breakEven = calculateBreakEven(params);
    expect(breakEven).toBeCloseTo(60120.12, 2);
  });

  it("应当准确计算净利润", () => {
    // 买 60000, 卖 61000, 数量 1, 费率 0.1%
    // 利润 = 1000 - (60 + 61) = 879
    const { profit, fees } = calculateNetProfit(60000, 61000, 1, 0.001, 0.001);
    expect(profit).toBe(879);
    expect(fees).toBe(121);
  });
});
