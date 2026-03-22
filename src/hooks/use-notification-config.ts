"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface NotificationConfig {
  bark_server_url: string;
  bark_device_key: string | null;
  is_enabled: boolean;
  alert_threshold_percent: number;
}

const supabase = createClient();

export function useNotificationConfig() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: fetchError } = await supabase
        .from("notification_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!data) {
        // Default config if none exists
        const defaultConfig: NotificationConfig = {
          bark_server_url: "https://api.day.app",
          bark_device_key: null,
          is_enabled: false,
          alert_threshold_percent: 5.0,
        };
        setConfig(defaultConfig);
      } else {
        setConfig(data as NotificationConfig);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig: Partial<NotificationConfig>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: updateError } = await supabase.from("notification_config").upsert(
        {
          user_id: user.id,
          ...newConfig,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (updateError) throw updateError;

      // Update local state
      setConfig((prev) => (prev ? { ...prev, ...newConfig } : null));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update config");
    }
  };

  const testBarkNotification = async (testConfig?: {
    bark_server_url?: string;
    bark_device_key?: string;
  }) => {
    // We can call a server action or an API route to trigger the test
    const response = await fetch("/api/notifications/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testConfig || {}),
    });

    if (!response.ok) {
      const resData = await response.json().catch(() => ({}));
      throw new Error(resData.error || "Failed to trigger test notification");
    }

    return true;
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    testBarkNotification,
  };
}
