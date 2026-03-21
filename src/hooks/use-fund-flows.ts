"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { FundFlow, FundFlowFormData } from "@/types/transaction";

/**
 * 资金流水 CRUD Hook
 */
export function useFundFlows() {
  const supabase = createClient();
  const [fundFlows, setFundFlows] = useState<FundFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFundFlows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("fund_flows")
        .select("*")
        .order("transacted_at", { ascending: false });

      if (fetchError) throw fetchError;
      setFundFlows((data as FundFlow[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch fund flows");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFundFlows();
  }, [fetchFundFlows]);

  const createFundFlow = useCallback(
    async (data: FundFlowFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("fund_flows").insert({
        user_id: user.user.id,
        exchange: data.exchange,
        direction: data.direction,
        amount: data.amount,
        currency: data.currency,
        notes: data.notes || null,
        transacted_at: data.transacted_at,
      });

      if (insertError) throw insertError;
      await fetchFundFlows();
    },
    [supabase, fetchFundFlows]
  );

  const deleteFundFlow = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("fund_flows")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchFundFlows();
    },
    [supabase, fetchFundFlows]
  );

  return {
    fundFlows,
    loading,
    error,
    createFundFlow,
    deleteFundFlow,
    refresh: fetchFundFlows,
  };
}
