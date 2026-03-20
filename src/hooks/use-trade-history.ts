import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import * as XLSX from "xlsx";

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
 */
export function useTradeHistory() {
  const [history, setHistory] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // 获取最近 10 条历史记录
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

  // 获取所有记录用于导出
  const fetchAllHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("calculations")
      .select("*")
      .order("created_at", { ascending: false });

    return error ? [] : (data as Calculation[]);
  };

  const exportToExcel = async () => {
    const allData = await fetchAllHistory();
    if (allData.length === 0) {
      alert("暂无历史交易数据可供导出");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TradeHistory");
    XLSX.writeFile(workbook, `TradeLens_History_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToJSON = async () => {
    const allData = await fetchAllHistory();
    if (allData.length === 0) {
      alert("暂无历史交易数据可供导出");
      return;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `TradeLens_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // 保存一条新记录
  const saveCalculation = async (calc: Calculation) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "请先登录" };

    const { error } = await supabase.from("calculations").insert([{ ...calc, user_id: user.id }]);
    if (!error) await fetchHistory();
    return { error };
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { 
    history, 
    isLoading, 
    saveCalculation, 
    refreshHistory: fetchHistory,
    exportToExcel,
    exportToJSON 
  };
}
