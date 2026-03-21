import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface TimeSeriesData {
  date: string;
  profit: number;
  cumulativeProfit: number;
}

export function useAnalytics() {
  const supabase = createClient();
  const [data, setData] = useState<TimeSeriesData[]>([]);
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
    
    transactions.forEach((t) => {
      const date = new Date(t.transacted_at).toLocaleDateString();
      const pnl = t.side === "SELL" ? t.quote_quantity : -t.quote_quantity;
      const fees = t.commission || 0; 
      
      dailyPnL[date] = (dailyPnL[date] || 0) + pnl - fees;
    });

    const sortedDates = Object.keys(dailyPnL).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    let cumulative = 0;
    const timeSeries = sortedDates.map((date) => {
      cumulative += dailyPnL[date];
      return {
        date,
        profit: dailyPnL[date],
        cumulativeProfit: cumulative,
      };
    });

    setData(timeSeries);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { timeSeries: data, loading, refresh: fetchAnalytics };
}
