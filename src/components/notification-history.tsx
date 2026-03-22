"use client";

import { useTranslations } from "next-intl";
import { useNotificationLogs } from "@/hooks/use-notification-logs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { sileo } from "sileo";
import { useState, useEffect } from "react";

// Removed unused Table imports

export function NotificationHistory({ refreshKey = 0 }: { refreshKey?: number }) {
  const t = useTranslations("Notifications");
  const { logs, loading, clearLogs, refresh, page, setPage, total, totalPages } =
    useNotificationLogs();
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    if (refreshKey > 0) {
      refresh();
    }
  }, [refreshKey, refresh]);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearLogs();
      sileo.success({ title: t("clearSuccess") });
      refresh();
    } catch {
      sileo.error({ title: t("clearFailed") });
    } finally {
      setIsClearing(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("loading", { fallback: "Loading..." })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t("historyTitle", { fallback: "Notification History" })}
            </CardTitle>
            <CardDescription>
              {t("historyDesc", { fallback: "Recent push notifications" })}
            </CardDescription>
          </div>
        </div>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={isClearing}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            {isClearing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            {t("clearHistory", { fallback: "Clear History" })}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {t("emptyHistory", { fallback: "No notification history" })}
            </div>
          ) : (
            <>
              <div className="h-[525px] overflow-hidden flex flex-col">
                {/* Custom Header */}
                <div className="grid grid-cols-[60px_1fr_1fr_120px] items-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b bg-slate-50/50 dark:bg-slate-900/50">
                  <div>{t("status")}</div>
                  <div>{t("columnTitle")}</div>
                  <div className="hidden md:block px-6">{t("columnContent")}</div>
                  <div className="text-right">{t("columnTime")}</div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[60px_1fr_1fr_120px] items-center px-6 h-[48px] border-b last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <div className="flex items-center">
                        {log.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="font-medium text-sm truncate pr-4">{log.title}</div>
                      <div className="text-xs text-muted-foreground hidden md:block px-6 max-w-[300px] truncate">
                        {log.body}
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground tabular-nums">
                        {format(new Date(log.created_at), "MM-dd HH:mm")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
                <div className="text-xs text-muted-foreground">
                  {t("pagination", {
                    current: page + 1,
                    total: totalPages || 1,
                    fallback: `Page ${page + 1} of ${totalPages || 1}`,
                  })}
                  <span className="ml-2">({total} items)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage((p) => Math.min(Math.max(0, totalPages - 1), p + 1))}
                    disabled={page >= totalPages - 1 || totalPages === 0}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
