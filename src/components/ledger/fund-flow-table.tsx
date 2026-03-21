"use client";

import { useTranslations } from "next-intl";
import { type FundFlow, EXCHANGE_LABELS } from "@/types/transaction";
import { Card } from "@/components/ui/card";
import { Trash2, ArrowDownToLine, ArrowUpFromLine, Pencil } from "lucide-react";

interface FundFlowTableProps {
  fundFlows: FundFlow[];
  loading: boolean;
  onEdit: (flow: FundFlow) => void;
  onDelete: (id: string) => void;
}

export function FundFlowTable({ fundFlows, loading, onEdit, onDelete }: FundFlowTableProps) {
  const t = useTranslations("Ledger");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">{t("time")}</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                {t("direction")}
              </th>
              <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                {t("amount")}
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                {t("currency")}
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                {t("exchange")}
              </th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                {t("notes")}
              </th>
              <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : fundFlows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  {t("emptyFundFlows")}
                </td>
              </tr>
            ) : (
              fundFlows.map((flow) => (
                <tr
                  key={flow.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(flow.transacted_at)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        flow.direction === "deposit"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      }`}
                    >
                      {flow.direction === "deposit" ? (
                        <ArrowDownToLine className="w-3 h-3" />
                      ) : (
                        <ArrowUpFromLine className="w-3 h-3" />
                      )}
                      {t(flow.direction)}
                    </span>
                  </td>
                  <td
                    className={`py-3 px-4 text-right font-mono font-semibold ${
                      flow.direction === "deposit" ? "text-emerald-600" : "text-orange-600"
                    }`}
                  >
                    {flow.direction === "deposit" ? "+" : "-"}
                    {formatAmount(flow.amount)}
                  </td>
                  <td className="py-3 px-4 text-center text-xs font-medium">{flow.currency}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                      {EXCHANGE_LABELS[flow.exchange] ?? flow.exchange}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">
                    {flow.notes || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(flow)}
                        title={t("edit")}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-muted-foreground hover:text-red-600"
                        onClick={() => onDelete(flow.id)}
                        title={t("delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
