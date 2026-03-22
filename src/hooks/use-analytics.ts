import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface TimeSeriesData {
  date: string;
  profit: number;
  cumulativeProfit: number;
  benchmarkProfit?: number; // Normalized benchmark profit
}

export interface MonthlyPnlData {
  month: string;
  profit: number;
}

export function useAnalytics() {
  const supabase = createClient();
  const [data, setData] = useState<TimeSeriesData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyPnlData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("price, quantity, side, quote_quantity, commission, transacted_at")
      .order("transacted_at", { ascending: true });

    if (error || !transactions) {
      setLoading(false);
      return;
    }

    // 处理交易流水，生成盈亏曲线
    const dailyPnL: Record<string, number> = {};
    const monthlyPnLMap: Record<string, number> = {};

    transactions.forEach((t) => {
      const dateObj = new Date(t.transacted_at);
      const date = dateObj.toLocaleDateString();
      const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;

      const pnl = t.side === "SELL" ? t.quote_quantity : -t.quote_quantity;
      const fees = t.commission || 0;
      const netPnL = pnl - fees;

      dailyPnL[date] = (dailyPnL[date] || 0) + netPnL;
      monthlyPnLMap[month] = (monthlyPnLMap[month] || 0) + netPnL;
    });

    const sortedDates = Object.keys(dailyPnL).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let cumulative = 0;
    const timeSeries = sortedDates.map((date, index) => {
      cumulative += dailyPnL[date];
      // Mock benchmark data: starts at 0, grows at ~0.05% per transaction/day on average
      // In a real scenario, this would be fetched from Alpaca/YF/Longbridge
      const benchmarkProfit = index * (cumulative * 0.0005);

      return {
        date,
        profit: dailyPnL[date],
        cumulativeProfit: cumulative,
        benchmarkProfit: index === 0 ? 0 : benchmarkProfit,
      };
    });

    const sortedMonths = Object.keys(monthlyPnLMap).sort();
    const monthlySeries = sortedMonths.map((month) => ({
      month,
      profit: monthlyPnLMap[month],
    }));

    setData(timeSeries);
    setMonthlyData(monthlySeries);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { timeSeries: data, monthlySeries: monthlyData, loading, refresh: fetchAnalytics };
}
