"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const supabase = createClient();

export function SyncStatus() {
  const t = useTranslations("Nav");
  const [status, setStatus] = useState<"pending" | "success" | "failed" | "idle">("idle");

  useEffect(() => {
    const fetchLatestStatus = async () => {
      const { data, error } = await supabase
        .from("sync_history")
        .select("status")
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setStatus(data.status as "pending" | "success" | "failed");
      }
    };

    fetchLatestStatus();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("sync_history_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sync_history",
        },
        () => {
          fetchLatestStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (status === "idle") return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 border border-border/50 transition-all hover:bg-secondary">
            {status === "pending" ? (
              <>
                <RefreshCcw className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span className="text-[10px] font-medium text-blue-600 hidden sm:inline">
                  {t("syncing")}
                </span>
              </>
            ) : status === "success" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                <span className="text-[10px] font-medium text-green-600 hidden sm:inline">
                  {t("syncIdle")}
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-[10px] font-medium text-destructive hidden sm:inline">
                  Error
                </span>
              </>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end" className="text-xs">
          {status === "pending" ? t("syncing") : t("syncIdle")}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
