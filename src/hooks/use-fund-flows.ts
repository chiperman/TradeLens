"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import type { FundFlow, FundFlowFormData } from "@/types/transaction";
import { useDataQuery } from "./base/use-data-query";
import type { User } from "@supabase/supabase-js";

/**
 * 资金流水 CRUD Hook
 */
const supabase = createClient();

export function useFundFlows() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setUser(data.user));
  }, []);

  const order = useMemo(() => ({ column: "transacted_at", ascending: false }), []);

  const {
    data: fundFlows,
    loading,
    error,
    refresh,
  } = useDataQuery<FundFlow>({
    table: "fund_flows",
    order,
    enabled: !!user,
  });

  const createFundFlow = useCallback(
    async (formData: FundFlowFormData) => {
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("fund_flows").insert({
        user_id: user.id,
        exchange: formData.exchange,
        direction: formData.direction,
        amount: formData.amount,
        currency: formData.currency,
        notes: formData.notes || null,
        transacted_at: formData.transacted_at,
      });

      if (insertError) throw insertError;
      await refresh();
    },
    [supabase, user, refresh]
  );

  const updateFundFlow = useCallback(
    async (id: string, formData: Partial<FundFlowFormData>) => {
      const { error: updateError } = await supabase
        .from("fund_flows")
        .update({
          ...formData,
          amount: formData.amount !== undefined ? Number(formData.amount) : undefined,
        })
        .eq("id", id);

      if (updateError) throw updateError;
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteFundFlow = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("fund_flows").delete().eq("id", id);

      if (deleteError) throw deleteError;
      await refresh();
    },
    [supabase, refresh]
  );

  return {
    fundFlows,
    loading,
    error,
    createFundFlow,
    updateFundFlow,
    deleteFundFlow,
    refresh,
  };
}
