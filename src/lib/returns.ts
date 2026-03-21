/**
 * 收益率与风险指标计算引擎
 *
 * 包含：简单收益率、TWR、IRR (牛顿法)、最大回撤、夏普比率、胜率、盈亏比
 */

// ============================================================
// 基础类型
// ============================================================

/** TWR 子周期 */
export interface TwrPeriod {
  beginValue: number;
  endValue: number;
  cashFlow: number; // 正=入金，负=出金（发生在期初）
}

/** IRR 现金流 */
export interface CashFlow {
  amount: number; // 正=流入，负=流出
  date: Date;
}

/** 已平仓交易 */
export interface ClosedTrade {
  pnl: number; // 正=盈利，负=亏损
}

// ============================================================
// 简单收益率
// ============================================================

/**
 * 简单收益率 = (期末 - 期初) / 期初
 */
export function simpleReturn(beginValue: number, endValue: number): number {
  if (beginValue === 0) return 0;
  return (endValue - beginValue) / beginValue;
}

// ============================================================
// 时间加权收益率 (TWR)
// ============================================================

/**
 * 时间加权收益率 — 消除资金流影响
 *
 * TWR = ∏(1 + Ri) - 1
 * 其中 Ri = (EndValue - BeginValue - CashFlow) / BeginValue
 */
export function timeWeightedReturn(periods: TwrPeriod[]): number {
  if (periods.length === 0) return 0;

  let product = 1;
  for (const p of periods) {
    if (p.beginValue === 0) continue;
    const periodReturn = (p.endValue - p.beginValue - p.cashFlow) / p.beginValue;
    product *= 1 + periodReturn;
  }

  return product - 1;
}

// ============================================================
// 金额加权收益率 (IRR) — 牛顿法
// ============================================================

/**
 * 牛顿法求解 IRR (日化后年化)
 *
 * NPV(r) = Σ CF_i / (1+r)^t_i = 0
 */
export function moneyWeightedReturn(
  cashFlows: CashFlow[],
  maxIterations = 100,
  tolerance = 1e-7
): number {
  if (cashFlows.length < 2) return 0;

  const baseDate = cashFlows[0].date.getTime();
  const dayMs = 86400000;

  // 将日期转为年份分数
  const flows = cashFlows.map((cf) => ({
    amount: cf.amount,
    years: (cf.date.getTime() - baseDate) / (dayMs * 365),
  }));

  let rate = 0.1; // 初始猜测 10%

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    for (const f of flows) {
      const discounted = Math.pow(1 + rate, f.years);
      npv += f.amount / discounted;
      dnpv -= (f.years * f.amount) / (discounted * (1 + rate));
    }

    if (Math.abs(npv) < tolerance) return rate;
    if (dnpv === 0) break;

    rate -= npv / dnpv;
  }

  return rate;
}

// ============================================================
// 最大回撤
// ============================================================

/**
 * 最大回撤 = Max((Peak - Trough) / Peak)
 * @param values 按时间排列的资产净值序列
 */
export function maxDrawdown(values: number[]): number {
  if (values.length < 2) return 0;

  let peak = values[0];
  let maxDd = 0;

  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDd) maxDd = dd;
  }

  return maxDd;
}

// ============================================================
// 夏普比率
// ============================================================

/**
 * 夏普比率 = (R_p - R_f) / σ_p
 * @param returns 周期收益率数组
 * @param riskFreeRate 同周期无风险利率 (默认 0)
 */
export function sharpeRatio(returns: number[], riskFreeRate = 0): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev < 1e-10) return 0;
  return (mean - riskFreeRate) / stdDev;
}

// ============================================================
// 胜率
// ============================================================

/**
 * 胜率 = 盈利交易数 / 总平仓交易数
 */
export function winRate(trades: ClosedTrade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnl > 0).length;
  return wins / trades.length;
}

// ============================================================
// 盈亏比
// ============================================================

/**
 * 盈亏比 = 平均盈利 / 平均亏损 (绝对值)
 */
export function profitLossRatio(trades: ClosedTrade[]): number {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  if (wins.length === 0 || losses.length === 0) return 0;

  const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / wins.length;
  const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0)) / losses.length;

  if (avgLoss === 0) return 0;
  return avgWin / avgLoss;
}
