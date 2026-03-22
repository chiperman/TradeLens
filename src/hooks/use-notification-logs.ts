"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface NotificationLog {
  id: string;
  user_id: string;
  title: string;
  body: string;
  status: "success" | "failed";
  error_message: string | null;
  created_at: string;
}

const supabase = createClient();

export function useNotificationLogs() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error: fetchError } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setLogs(data as NotificationLog[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const clearLogs = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error: deleteError } = await supabase
        .from("notification_logs")
        .delete()
        .eq("user_id", user.user.id);

      if (deleteError) throw deleteError;
      setLogs([]);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to clear logs");
    }
  };

  return {
    logs,
    loading,
    error,
    clearLogs,
    refresh: fetchLogs,
  };
}
