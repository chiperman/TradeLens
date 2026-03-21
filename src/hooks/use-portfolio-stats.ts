"use client";

import { useMemo } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useFundFlows } from "@/hooks/use-fund-flows";
import { simpleReturn, maxDrawdown, sharpeRatio, winRate, profitLossRatio } from "@/lib/returns";
import type { ClosedTrade } from "@/lib/returns";

export interface PortfolioStats {
  /** 总已实现盈亏 */
  totalPnl: number;
  /** 总收益率 (简单) */
  totalReturn: number;
  /** 最大回撤 */
  maxDrawdownPct: number;
  /** 夏普比率 */
  sharpe: number;
  /** 胜率 */
  winRatePct: number;
  /** 盈亏比 */
  plRatio: number;
  /** 总入金额 */
  totalDeposits: number;
  /** 总出金额 */
  totalWithdrawals: number;
  /** 交易总数 */
  tradeCount: number;
  /** 月度收益数组 */
  monthlyReturns: { month: string; pnl: number }[];
  /** 累计 P&L 序列 */
  cumulativePnl: { date: string; value: number }[];
}

/**
 * 聚合交易数据，计算持仓和 KPI 指标
 */
export function usePortfolioStats(): {
  stats: PortfolioStats;
  loading: boolean;
} {
  const { transactions, loading: txLoading } = useTransactions();
  const { fundFlows, loading: ffLoading } = useFundFlows();

  const stats = useMemo<PortfolioStats>(() => {
    // 默认值
    const empty: PortfolioStats = {
      totalPnl: 0,
      totalReturn: 0,
      maxDrawdownPct: 0,
      sharpe: 0,
      winRatePct: 0,
      plRatio: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      tradeCount: 0,
      monthlyReturns: [],
      cumulativePnl: [],
    };

    if (!transactions || transactions.length === 0) return empty;

    // 1. 按标的聚合交易，计算已实现盈亏
    const positionMap = new Map<string, { avgCost: number; qty: number; totalBuyCost: number }>();
    const closedTrades: ClosedTrade[] = [];
    const dailyPnl: Record<string, number> = {};

    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.transacted_at).getTime() - new Date(b.transacted_at).getTime()
    );

    for (const tx of sortedTx) {
      const key = `${tx.symbol}:${tx.exchange}`;
      const pos = positionMap.get(key) || {
        avgCost: 0,
        qty: 0,
        totalBuyCost: 0,
      };
      const dateKey = new Date(tx.transacted_at).toISOString().slice(0, 10);

      if (tx.side === "BUY") {
        pos.totalBuyCost += tx.price * tx.quantity;
        pos.qty += tx.quantity;
        pos.avgCost = pos.qty > 0 ? pos.totalBuyCost / pos.qty : 0;
      } else {
        // SELL — 计算已实现盈亏
        const pnl = (tx.price - pos.avgCost) * tx.quantity - (tx.commission || 0);
        closedTrades.push({ pnl });
        dailyPnl[dateKey] = (dailyPnl[dateKey] || 0) + pnl;

        pos.qty -= tx.quantity;
        pos.totalBuyCost = pos.avgCost * pos.qty;
      }

      positionMap.set(key, pos);
    }

    // 2. 计算总已实现 P&L
    const totalPnl = closedTrades.reduce((s, t) => s + t.pnl, 0);

    // 3. 累计 P&L 序列
    const sortedDates = Object.keys(dailyPnl).sort();
    const cumulativePnl = sortedDates.reduce<{ date: string; value: number }[]>((acc, date) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
      acc.push({ date, value: prev + dailyPnl[date] });
      return acc;
    }, []);

    // 4. 月度收益
    const monthlyMap: Record<string, number> = {};
    for (const [date, pnl] of Object.entries(dailyPnl)) {
      const month = date.slice(0, 7);
      monthlyMap[month] = (monthlyMap[month] || 0) + pnl;
    }
    const monthlyReturns = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, pnl]) => ({ month, pnl }));

    // 5. 风险指标
    const totalCost = sortedTx
      .filter((t) => t.side === "BUY")
      .reduce((s, t) => s + t.price * t.quantity, 0);

    const totalReturn = simpleReturn(totalCost, totalCost + totalPnl);
    const drawdownValues = cumulativePnl.map((p) => p.value);
    const maxDd = maxDrawdown(drawdownValues.length > 0 ? drawdownValues : [0]);

    // 日收益率序列
    const dailyReturns = sortedDates.map((d) => dailyPnl[d] / (totalCost || 1));
    const sharpe = sharpeRatio(dailyReturns, 0);

    // 6. 资金流水
    const totalDeposits = (fundFlows || [])
      .filter((f) => f.direction === "deposit")
      .reduce((s, f) => s + f.amount, 0);
    const totalWithdrawals = (fundFlows || [])
      .filter((f) => f.direction === "withdrawal")
      .reduce((s, f) => s + f.amount, 0);

    return {
      totalPnl,
      totalReturn,
      maxDrawdownPct: maxDd,
      sharpe,
      winRatePct: winRate(closedTrades),
      plRatio: profitLossRatio(closedTrades),
      totalDeposits,
      totalWithdrawals,
      tradeCount: transactions.length,
      monthlyReturns,
      cumulativePnl,
    };
  }, [transactions, fundFlows]);

  return { stats, loading: txLoading || ffLoading };
}
