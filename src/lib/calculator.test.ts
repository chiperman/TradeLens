import { describe, it, expect } from "vitest";
import { calculateBreakEven, calculateNetProfit } from "./calculator";
import { type FeeModel } from "@/types/transaction";

const cryptoFee: FeeModel = { type: "percentage", rate: 0.001, currency: "USDT" };

describe("Trade Calculator Logic", () => {
  it("应当准确计算保本价 (考虑双向手续费)", () => {
    const buyPrice = 60000;
    const quantity = 1;

    // baseReceived = 1 * (1 - 0.001) = 0.999
    // buyCostQuote = 60000 * 1 = 60000
    // 保本价 = 60000 / (0.999 * (1 - 0.001)) = 60000 / (0.999 * 0.999) = 60120.18
    const breakEven = calculateBreakEven(buyPrice, quantity, cryptoFee, cryptoFee, "crypto");
    expect(breakEven).toBeCloseTo(60120.18, 2);
  });

  it("应当准确计算净利润", () => {
    // 买 60000, 卖 61000, 数量 1, 费率 0.1%
    // 利润 = 61000 * 0.999 * 0.999 - 60000 = 878.061
    // 手续费 = 60000 * 0.001 + 61000 * 0.999 * 0.001 = 120.939
    const { profit, fees } = calculateNetProfit(60000, 61000, 1, cryptoFee, cryptoFee, "crypto");
    expect(profit).toBeCloseTo(878.06, 2);
    expect(fees).toBeCloseTo(120.94, 2);
  });
});
