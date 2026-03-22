"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface NotificationConfig {
  id?: string;
  user_id?: string;
  bark_server_url: string;
  bark_device_key: string | null;
  is_enabled: boolean;
  alert_threshold_percent: number;
}

const DEFAULT_CONFIG: NotificationConfig = {
  bark_server_url: "https://api.day.app",
  bark_device_key: "",
  is_enabled: false,
  alert_threshold_percent: 5.0,
};

export function useNotificationConfig() {
  const supabase = createClient();
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error: fetchError } = await supabase
        .from("notification_config")
        .select("*")
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setConfig(data);
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notification config");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (newConfig: Partial<NotificationConfig>) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Check if config exists
      const { data: existing } = await supabase
        .from("notification_config")
        .select("id")
        .eq("user_id", user.user.id)
        .maybeSingle();

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from("notification_config")
          .update(newConfig)
          .eq("user_id", user.user.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("notification_config")
          .insert([{ ...DEFAULT_CONFIG, ...newConfig, user_id: user.user.id }]);
        error = insertError;
      }

      if (error) throw error;
      setConfig((prev) => ({ ...prev, ...newConfig }));
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to update notification config");
    }
  };

  const testBarkNotification = async () => {
    if (!config.bark_device_key) {
      throw new Error("Device Key is required");
    }

    // Calls the real Bark server direct from client for testing purposes.
    // In actual alert logic, your server will call it.
    const url = new URL(
      `/${config.bark_device_key}/TradeLens%20通知测试/成功接收来自%20TradeLens%20的实时通知流`,
      config.bark_server_url || "https://api.day.app"
    );
    url.searchParams.append("group", "TradeLens");
    url.searchParams.append("icon", "https://github.com/chiperman.png");

    const response = await fetch(url.toString(), { method: "GET" });
    if (!response.ok) {
      const resData = await response.json().catch(() => ({}));
      throw new Error(resData.message || "推送测试失败");
    }

    return true;
  };

  return {
    config,
    loading,
    error,
    updateConfig,
    testBarkNotification,
    refresh: fetchConfig,
  };
}
