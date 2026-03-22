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

const PAGE_SIZE = 10;
const supabase = createClient();

export function useNotificationLogs() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async (targetPage: number, silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const from = targetPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact" })
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;

      setLogs(data as NotificationLog[]);
      if (count !== null) setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [page, fetchLogs]);

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
      setTotal(0);
      setPage(0);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to clear logs");
    }
  };

  const refresh = async () => {
    if (page === 0) {
      await fetchLogs(0, true);
    } else {
      setPage(0);
    }
  };

  return {
    logs,
    loading,
    error,
    clearLogs,
    refresh,
    page,
    setPage,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}
