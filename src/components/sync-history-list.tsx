"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { getSyncHistory } from "@/app/actions/sync-history";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface SyncHistory {
  id: string;
  user_id: string;
  exchange: string;
  status: "pending" | "success" | "failed" | "partial";
  trades_count: number;
  fund_flows_count: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  is_automated: boolean;
}

export function SyncHistoryList({ 
  limit = 10,
  initialData = []
}: { 
  limit?: number;
  initialData?: SyncHistory[];
}) {
  const t = useTranslations("Settings.SyncHistory");
  const [history, setHistory] = useState<SyncHistory[]>(initialData);
  const [loading, setLoading] = useState(initialData.length === 0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSyncHistory(limit);
      setHistory(data as SyncHistory[]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="success" className="flex w-fit items-center gap-1 bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3" />
            {t("status.success")}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex w-fit items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("status.failed")}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="flex w-fit items-center gap-1">
            <Clock className="h-3 w-3 animate-pulse" />
            {t("status.pending")}
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="warning" className="flex w-fit items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
            <AlertCircle className="h-3 w-3" />
            {t("status.partial")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100">
            <RefreshCcw className={cn("w-5 h-5 text-blue-600", loading && "animate-spin")} />
          </div>
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">{t("table.time")}</TableHead>
              <TableHead>{t("table.exchange")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.results")}</TableHead>
              <TableHead>{t("table.type")}</TableHead>
              <TableHead className="text-right pr-6">{t("table.duration")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t("loading")}
                </TableCell>
              </TableRow>
            ) : history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {t("noHistory")}
                </TableCell>
              </TableRow>
            ) : (
              history.map((item) => {
                const duration = item.completed_at
                  ? Math.round(
                      (new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / 1000
                    )
                  : null;

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium pl-6 whitespace-nowrap">
                      {format(new Date(item.started_at), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="capitalize">{item.exchange}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] leading-tight text-muted-foreground">
                        <span>{t("trades")}: {item.trades_count}</span>
                        <span>{t("fundFlows")}: {item.fund_flows_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {item.is_automated ? t("type.auto") : t("type.manual")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground pr-6 text-xs">
                      {duration !== null ? `${duration}s` : "-"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
