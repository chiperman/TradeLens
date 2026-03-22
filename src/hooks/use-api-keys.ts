"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { ExchangeName } from "@/lib/exchange/types";

export interface ApiKey {
  id: string;
  exchange: ExchangeName;
  auth_type: string;
  label: string;
  last_sync_at: string | null;
  created_at: string;
}

const supabase = createClient();

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);
    try {
      const res = await fetch("/api/settings/keys", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (Array.isArray(data)) setKeys(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveKey = async (
    exchange: string,
    apiKey: string,
    apiSecret: string,
    label: string,
    passphrase?: string
  ) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("请先登录");

    const res = await fetch("/api/settings/keys", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ exchange, apiKey, apiSecret, passphrase, label }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    await fetchKeys();
    return data;
  };

  const deleteKey = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("请先登录");

    const res = await fetch("/api/settings/keys", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    await fetchKeys();
  };

  const testConnection = async (id: string): Promise<boolean> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("请先登录");

    const res = await fetch("/api/settings/keys", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    return data.connected === true;
  };

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  return { keys, loading, saveKey, deleteKey, testConnection, refresh: fetchKeys };
}
