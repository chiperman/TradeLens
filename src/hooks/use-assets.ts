"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface AssetSummary {
  base_asset: string;
  total_quantity: number;
  total_cost: number;
  average_price: number;
}

export function useAssets() {
  const supabase = createClient();
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("assets_summary")
      .select("*")
      .order("total_cost", { ascending: false });

    if (!error && data) {
      setAssets(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAssets();
    
    // 监听交易表变更，自动刷新资产汇总
    const channel = supabase
      .channel("assets-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => fetchAssets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAssets, supabase]);

  return { assets, loading, refresh: fetchAssets };
}
