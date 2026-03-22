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

const PAGE_SIZE = 20;
const supabase = createClient();

export function useNotificationLogs() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchLogs = useCallback(async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data, error: fetchError } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (fetchError) throw fetchError;

      setLogs(data as NotificationLog[]);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadMoreLogs = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const currentLength = logs.length;

      const { data, error: fetchError } = await supabase
        .from("notification_logs")
        .select("*")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .range(currentLength, currentLength + PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      setLogs((prev) => {
        // Prevent accidental duplications by checking IDs
        const newItems = (data as NotificationLog[]).filter(
          (d) => !prev.some((p) => p.id === d.id)
        );
        return [...prev, ...newItems];
      });
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more logs");
    } finally {
      setLoadingMore(false);
    }
  };

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
      setHasMore(false);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to clear logs");
    }
  };

  return {
    logs,
    loading,
    error,
    clearLogs,
    refresh: () => fetchLogs(true),
    hasMore,
    loadingMore,
    loadMoreLogs,
  };
}
