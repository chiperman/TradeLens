import { describe, it, expect } from "vitest";
import {
  simpleReturn,
  timeWeightedReturn,
  moneyWeightedReturn,
  maxDrawdown,
  sharpeRatio,
  winRate,
  profitLossRatio,
} from "./returns";

describe("simpleReturn", () => {
  it("计算正收益", () => {
    expect(simpleReturn(100, 120)).toBeCloseTo(0.2);
  });

  it("计算负收益", () => {
    expect(simpleReturn(100, 80)).toBeCloseTo(-0.2);
  });

  it("零初始值返回 0", () => {
    expect(simpleReturn(0, 100)).toBe(0);
  });
});

describe("timeWeightedReturn", () => {
  it("单周期等于简单收益率", () => {
    const twr = timeWeightedReturn([{ beginValue: 100, endValue: 110, cashFlow: 0 }]);
    expect(twr).toBeCloseTo(0.1);
  });

  it("多周期正确消除资金流影响", () => {
    // 周期1: 100 -> 120 (无资金流) -> +20%
    // 周期2: 120+50 (入金50) -> 180 (涨) -> (180-170)/170 ≈ 5.88%
    const twr = timeWeightedReturn([
      { beginValue: 100, endValue: 120, cashFlow: 0 },
      { beginValue: 170, endValue: 180, cashFlow: 50 },
    ]);
    // (1+0.2) * (1 + (180-170-50)/170) - 1
    // = 1.2 * (1 + (-40/170)) - 1
    // = 1.2 * (1 - 0.2353) - 1
    // = 1.2 * 0.7647 - 1 ≈ -0.0824
    expect(twr).toBeCloseTo(-0.0824, 2);
  });

  it("空数组返回 0", () => {
    expect(timeWeightedReturn([])).toBe(0);
  });
});

describe("moneyWeightedReturn (IRR)", () => {
  it("简单场景：投入100，一年后获120", () => {
    const irr = moneyWeightedReturn([
      { amount: -100, date: new Date("2025-01-01") },
      { amount: 120, date: new Date("2026-01-01") },
    ]);
    expect(irr).toBeCloseTo(0.2, 1);
  });

  it("少于2个现金流返回 0", () => {
    expect(moneyWeightedReturn([])).toBe(0);
    expect(moneyWeightedReturn([{ amount: -100, date: new Date() }])).toBe(0);
  });
});

describe("maxDrawdown", () => {
  it("计算最大回撤", () => {
    // 100 -> 120 -> 90 -> 110
    // Peak=120, Trough=90, DD = 30/120 = 0.25
    expect(maxDrawdown([100, 120, 90, 110])).toBeCloseTo(0.25);
  });

  it("单调递增无回撤", () => {
    expect(maxDrawdown([100, 110, 120, 130])).toBe(0);
  });

  it("少于2个值返回 0", () => {
    expect(maxDrawdown([100])).toBe(0);
  });
});

describe("sharpeRatio", () => {
  it("计算正夏普比率", () => {
    const returns = [0.05, 0.03, 0.04, 0.06, 0.02];
    const sr = sharpeRatio(returns, 0.01);
    expect(sr).toBeGreaterThan(0);
  });

  it("少于2个数据点返回 0", () => {
    expect(sharpeRatio([0.05])).toBe(0);
  });

  it("零标准差返回 0", () => {
    expect(sharpeRatio([0.05, 0.05, 0.05])).toBe(0);
  });
});

describe("winRate", () => {
  it("计算胜率", () => {
    expect(winRate([{ pnl: 100 }, { pnl: -50 }, { pnl: 200 }, { pnl: -30 }])).toBeCloseTo(0.5);
  });

  it("空数组返回 0", () => {
    expect(winRate([])).toBe(0);
  });
});

describe("profitLossRatio", () => {
  it("计算盈亏比", () => {
    // 平均盈利 = (100+200)/2 = 150
    // 平均亏损 = (50+30)/2 = 40
    // 盈亏比 = 150/40 = 3.75
    const ratio = profitLossRatio([{ pnl: 100 }, { pnl: -50 }, { pnl: 200 }, { pnl: -30 }]);
    expect(ratio).toBeCloseTo(3.75);
  });

  it("无亏损交易返回 0", () => {
    expect(profitLossRatio([{ pnl: 100 }])).toBe(0);
  });
});
