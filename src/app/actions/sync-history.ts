"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSyncHistory(limit = 10) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("sync_history")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch sync history:", error);
    return [];
  }

  return data;
}
