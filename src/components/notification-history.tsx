"use client";

import { useTranslations } from "next-intl";
import { useNotificationLogs } from "@/hooks/use-notification-logs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export function NotificationHistory() {
  const t = useTranslations("Notifications");
  const { logs, loading, clearLogs } = useNotificationLogs();

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t("loading", { fallback: "Loading..." })}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <CardTitle>{t("historyTitle", { fallback: "Notification History" })}</CardTitle>
            <CardDescription>
              {t("historyDesc", { fallback: "Recent push notifications" })}
            </CardDescription>
          </div>
        </div>

        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("clearHistory", { fallback: "Clear History" })}
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 font-medium">
            {t("emptyHistory", { fallback: "No notification history" })}
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex gap-4 p-4 rounded-xl border bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
              >
                <div className="mt-0.5">
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm text-slate-900">{log.title}</p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {format(new Date(log.created_at), "MM-dd HH:mm")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{log.body}</p>
                  {log.error_message && (
                    <p className="text-[10px] text-red-500 bg-red-50 p-1.5 rounded mt-2">
                      {log.error_message}
                    </p>
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
