"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";

export interface ApiKey {
  id: string;
  exchange: string;
  label: string;
  created_at: string;
}

export function useApiKeys() {
  const supabase = createClient();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);
    const response = await fetch("/api/settings/keys", {
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
      },
    });
    const data = await response.json();
    if (Array.isArray(data)) setKeys(data);
    setLoading(false);
  }, [supabase]);

  const saveKey = async (exchange: string, apiKey: string, apiSecret: string, label: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("请先登录");

    const response = await fetch("/api/settings/keys", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ exchange, apiKey, apiSecret, label }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    await fetchKeys();
    return data;
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKeys();
  }, [fetchKeys]);

  return { keys, loading, saveKey, refresh: fetchKeys };
}
