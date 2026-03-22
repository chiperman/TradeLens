"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type {
  OptionPosition,
  OptionInsertParams,
  OptionUpdateParams,
  OptionStatus,
} from "@/lib/options";

const supabase = createClient();

export function useOptions(initialStatus?: OptionStatus) {
  const [positions, setPositions] = useState<OptionPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("options_positions")
        .select("*")
        .order("opened_at", { ascending: false });

      if (initialStatus) {
        query = query.eq("status", initialStatus);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPositions(data || []);
    } catch (err: unknown) {
      console.error("Error fetching options:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [initialStatus]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const addPosition = async (params: OptionInsertParams) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      const { data, error: insertError } = await supabase
        .from("options_positions")
        .insert({
          ...params,
          user_id: user.id,
          status: "OPEN",
          multiplier: params.multiplier || 100,
          underlying_symbol: params.underlying_symbol.toUpperCase(),
          option_type: params.option_type.toUpperCase(),
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setPositions((prev) => [data, ...prev]);
      return { success: true, data };
    } catch (err: unknown) {
      console.error("Failed to add option:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const updatePosition = async (id: string, params: OptionUpdateParams) => {
    try {
      const updatePayload: Partial<OptionPosition> = { ...params };
      if (params.status && params.status !== "OPEN" && !params.closed_at) {
        updatePayload.closed_at = new Date().toISOString();
      }

      const { data, error: updateError } = await supabase
        .from("options_positions")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      setPositions((prev) => prev.map((p) => (p.id === id ? data : p)));
      return { success: true, data };
    } catch (err: unknown) {
      console.error("Failed to update option:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const deletePosition = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from("options_positions").delete().eq("id", id);

      if (deleteError) throw deleteError;
      setPositions((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (err: unknown) {
      console.error("Failed to delete option:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  return {
    positions,
    loading,
    error,
    refresh: fetchPositions,
    addPosition,
    updatePosition,
    deletePosition,
  };
}
