import { describe, expect, it } from "vitest";
import { calculateDcaSummary } from "./calculations";

describe("calculateDcaSummary", () => {
  it("tracks remaining cost and current pnl after partial sells", () => {
    const summary = calculateDcaSummary({
      currentPrice: 50000,
      entries: [
        { type: "buy", quantity: 0.1, price: 40000, fee: 2 },
        { type: "buy", quantity: 0.1, price: 60000, fee: 2 },
        { type: "sell", quantity: 0.05, price: 70000, fee: 3 },
      ],
    });

    expect(summary.totalQuantity).toBeCloseTo(0.15);
    expect(summary.cumulativeInput).toBeCloseTo(10004);
    expect(summary.recoveredPrincipal).toBeCloseTo(3497);
    expect(summary.remainingCost).toBeCloseTo(6507);
    expect(summary.currentValue).toBeCloseTo(7500);
    expect(summary.currentPnl).toBeCloseTo(993);
  });
});
