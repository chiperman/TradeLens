"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import type { ExchangeName } from "@/lib/exchange/types";

interface SyncState {
  syncing: boolean;
  exchange: ExchangeName | null;
  result: {
    tradesCount: number;
    fundFlowsCount: number;
  } | null;
  error: string | null;
}

export function useSync() {
  const supabase = createClient();
  const [state, setState] = useState<SyncState>({
    syncing: false,
    exchange: null,
    result: null,
    error: null,
  });

  const syncExchange = async (exchange: ExchangeName, symbols?: string[]) => {
    setState({ syncing: true, exchange, result: null, error: null });

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("请先登录");

      const res = await fetch("/api/exchange/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exchange, symbols }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "同步失败");
      }

      setState({
        syncing: false,
        exchange,
        result: {
          tradesCount: data.tradesCount || 0,
          fundFlowsCount: data.fundFlowsCount || 0,
        },
        error: null,
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "同步失败";
      setState({ syncing: false, exchange, result: null, error: message });
      throw err;
    }
  };

  const resetState = () => {
    setState({ syncing: false, exchange: null, result: null, error: null });
  };

  return {
    ...state,
    syncExchange,
    resetState,
  };
}
