"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { getSyncHistory } from "@/app/actions/sync-history";
import { cn } from "@/lib/utils";

interface SyncHistory {
  id: string;
  user_id: string;
  exchange: string;
  status: "pending" | "success" | "failed";
  trades_count: number;
  fund_flows_count: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  is_automated: boolean;
}

export function SyncHistoryList() {
  const [history, setHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSyncHistory();
      setHistory(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100">
            <RefreshCcw className={cn("w-5 h-5 text-blue-600", loading && "animate-spin")} />
          </div>
          <div>
            <CardTitle>同步日志</CardTitle>
            <CardDescription>最近 10 次交易所自动化对账记录</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && history.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">加载中...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">暂无同步记录</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  {item.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : item.status === "failed" ? (
                    <XCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                  <div>
                    <p className="text-sm font-medium uppercase">{item.exchange}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(item.started_at), "yyyy-MM-dd HH:mm:ss")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {item.status === "success" ? (
                    <span className="text-[10px] font-mono bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      +{item.trades_count} Trades
                    </span>
                  ) : item.status === "failed" ? (
                    <span className="text-[10px] text-red-500 max-w-[150px] truncate block">
                      {item.error_message}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">进行中...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
