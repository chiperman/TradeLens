"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useFundFlows } from "@/hooks/use-fund-flows";
import { useNotificationConfig } from "@/hooks/use-notification-config";
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
  /** 总买入成本 */
  totalCost: number;
  /** 总入金额 */
  totalDeposits: number;
  /** 总出金额 */
  totalWithdrawals: number;
  /** 交易总数 */
  tradeCount: number;
  /** 内部收益率 (IRR) */
  irr: number;
  /** 时间加权收益率 (TWR) */
  twr: number;
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

  const [asyncStats, setAsyncStats] = useState({ irr: 0, twr: 0 });
  const workerRef = useRef<Worker | null>(null);
  const lastNotifiedValue = useRef<number | null>(null);
  const { config: notifyConfig } = useNotificationConfig();

  useEffect(() => {
    // Initialize Web Worker
    workerRef.current = new Worker(new URL("../workers/returns.worker.ts", import.meta.url));

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { id, result, error } = e.data;
      if (error) {
        console.error("Worker Error:", error);
        return;
      }

      if (id === "irr") {
        setAsyncStats((prev) => ({ ...prev, irr: result as number }));
      } else if (id === "twr") {
        setAsyncStats((prev) => ({ ...prev, twr: result as number }));
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const stats = useMemo<PortfolioStats>(() => {
    // 默认值
    const empty: PortfolioStats = {
      totalPnl: 0,
      totalReturn: 0,
      maxDrawdownPct: 0,
      sharpe: 0,
      winRatePct: 0,
      plRatio: 0,
      totalCost: 0,
      totalDeposits: 0,
      totalWithdrawals: 0,
      tradeCount: 0,
      irr: asyncStats.irr,
      twr: asyncStats.twr,
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
      totalCost,
      totalDeposits,
      totalWithdrawals,
      tradeCount: transactions.length,
      irr: asyncStats.irr,
      twr: asyncStats.twr,
      monthlyReturns,
      cumulativePnl,
    };
  }, [transactions, fundFlows, asyncStats.irr, asyncStats.twr]);

  // 触发 Web Worker 计算
  useEffect(() => {
    if (!workerRef.current || !fundFlows) return;

    const cashFlows = fundFlows.map((f) => ({
      amount: f.direction === "deposit" ? -f.amount : f.amount,
      date: f.transacted_at,
    }));

    const currentValue = stats.totalDeposits - stats.totalWithdrawals + stats.totalPnl;
    if (currentValue > 0) {
      cashFlows.push({
        amount: currentValue,
        date: new Date().toISOString(),
      });
    }

    if (cashFlows.length > 1) {
      workerRef.current.postMessage({
        type: "CALCULATE_IRR",
        id: "irr",
        payload: { cashFlows },
      });
    }

    workerRef.current.postMessage({
      type: "CALCULATE_TWR",
      id: "twr",
      payload: {
        periods: [
          { beginValue: stats.totalCost, endValue: stats.totalCost + stats.totalPnl, cashFlow: 0 },
        ],
      },
    });
  }, [fundFlows, stats.totalDeposits, stats.totalWithdrawals, stats.totalPnl, stats.totalCost]);

  // 推送逻辑：当组合价值变动超过阈值时发送通知
  useEffect(() => {
    if (!notifyConfig || !notifyConfig.is_enabled || txLoading || ffLoading) return;

    const currentPortValue = stats.totalDeposits - stats.totalWithdrawals + stats.totalPnl;

    // 初始化或第一次获取到值
    if (lastNotifiedValue.current === null) {
      lastNotifiedValue.current = currentPortValue;
      return;
    }

    const diff = Math.abs(currentPortValue - lastNotifiedValue.current);
    const percentChange = (diff / (Math.abs(lastNotifiedValue.current) || 1)) * 100;

    if (percentChange >= notifyConfig.alert_threshold_percent) {
      const isUp = currentPortValue > lastNotifiedValue.current;
      const title = isUp ? "📈 投资组合上涨提醒" : "📉 投资组合下跌提醒";
      const body = `组合总估值变动了 ${percentChange.toFixed(2)}%。当前估值：$${currentPortValue.toFixed(2)}`;

      // 调用 API 发送推送
      fetch("/api/notifications/notify", {
        method: "POST",
        body: JSON.stringify({ title, body }),
      }).catch((err) => console.error("Failed to trigger automated notification:", err));

      lastNotifiedValue.current = currentPortValue;
    }
  }, [
    stats.totalPnl,
    stats.totalDeposits,
    stats.totalWithdrawals,
    notifyConfig,
    txLoading,
    ffLoading,
  ]);

  return { stats, loading: txLoading || ffLoading };
}
