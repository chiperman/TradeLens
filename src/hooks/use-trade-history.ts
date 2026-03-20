import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface Calculation {
  id?: string;
  user_id?: string;
  buy_price: number;
  sell_price?: number;
  quantity: number;
  profit?: number;
  fees: number;
  type: "break_even" | "profit";
  created_at?: string;
}

/**
 * 交易历史记录 Hook
 * 用于在 Supabase 中存储和检索用户的计算记录
 */
export function useTradeHistory() {
  const [history, setHistory] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // 获取最近 10 条历史记录
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from("calculations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setHistory(data as Calculation[]);
      }
    } catch (err) {
      console.error("Fetch history failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // 保存一条新记录
  const saveCalculation = async (calc: Calculation) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { error } = await supabase.from("calculations").insert([{ ...calc, user_id: user.id }]);

    if (!error) {
      await fetchHistory();
    }
    return { error };
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, isLoading, saveCalculation, refreshHistory: fetchHistory };
}
