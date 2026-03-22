import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import * as ExcelJS from "exceljs";
import { useDataQuery } from "./base/use-data-query";
import type { User } from "@supabase/supabase-js";

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
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const {
    data: history,
    loading: isLoading,
    refresh: refreshHistory,
  } = useDataQuery<Calculation>({
    table: "calculations",
    order: { column: "created_at", ascending: false },
    limit: 10,
    enabled: !!user,
  });

  // 获取所有记录用于导出
  const fetchAllHistory = async () => {
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

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("TradeHistory");

    // Add headers based on keys in the first object
    const keys = Object.keys(allData[0]) as (keyof Calculation)[];
    worksheet.columns = keys.map((key) => ({ header: key, key, width: 20 }));

    allData.forEach((row) => {
      worksheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TradeLens_History_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async () => {
    const allData = await fetchAllHistory();
    if (allData.length === 0) {
      alert("暂无历史交易数据可供导出");
      return;
    }

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `TradeLens_Backup_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // 保存一条新记录
  const saveCalculation = async (calc: Calculation) => {
    if (!user) return { error: "请先登录" };
    const { error } = await supabase.from("calculations").insert([{ ...calc, user_id: user.id }]);
    if (!error) await refreshHistory();
    return { error };
  };

  // 删除一条记录
  const deleteCalculation = async (id: string) => {
    if (!user) return { error: "请先登录" };
    const { error } = await supabase.from("calculations").delete().eq("id", id);
    if (!error) await refreshHistory();
    return { error };
  };

  return {
    history,
    isLoading,
    saveCalculation,
    deleteCalculation,
    refreshHistory,
    exportToExcel,
    exportToJSON,
  };
}
