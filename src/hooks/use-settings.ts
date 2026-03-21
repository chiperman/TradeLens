"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { FeeConfig } from "@/types/transaction";

export interface UserSettings {
  currency_preference: string;
  fee_config: FeeConfig;
}

const DEFAULT_FEE_CONFIG: FeeConfig = {
  us_stock: { type: "per_share", rate: 0.005, min: 1.0, currency: "USD" },
  hk_stock: { type: "percentage", rate: 0.0003, min: 15.0, currency: "HKD" },
  crypto: { type: "percentage", rate: 0.001, currency: "USDT" },
};

export function useSettings() {
  const supabase = createClient();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("currency_preference, fee_config")
        .eq("id", user.user.id)
        .single();

      if (fetchError) throw fetchError;

      setSettings({
        currency_preference: data.currency_preference || "CNY",
        fee_config: (data.fee_config as unknown as FeeConfig) || DEFAULT_FEE_CONFIG,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase
        .from("profiles")
        .update(newSettings)
        .eq("id", user.user.id);

      if (updateError) throw updateError;
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update settings");
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: fetchSettings,
  };
}
