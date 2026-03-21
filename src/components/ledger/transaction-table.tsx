"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  type Transaction,
  type TransactionFilter,
  type SortState,
  type PaginationState,
  ASSET_CLASSES,
  EXCHANGES,
  ASSET_CLASS_LABELS,
  EXCHANGE_LABELS,
} from "@/types/transaction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Filter,
  X,
} from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
  loading: boolean;
  pagination: PaginationState;
  sort: SortState;
  filter: TransactionFilter;
  onFilterChange: (filter: TransactionFilter) => void;
  onSortChange: (sort: SortState) => void;
  onPageChange: (page: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({
  transactions,
  loading,
  pagination,
  sort,
  filter,
  onFilterChange,
  onSortChange,
  onPageChange,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const t = useTranslations("Ledger");
  const [showFilters, setShowFilters] = useState(false);

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  const handleSort = (column: string) => {
    onSortChange({
      column,
      direction:
        sort.column === column && sort.direction === "desc" ? "asc" : "desc",
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const hasActiveFilters = Object.values(filter).some(
    (v) => v !== undefined && v !== ""
  );

  return (
    <div className="space-y-4">
      {/* 筛选栏 */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-primary text-primary" : ""}
        >
          <Filter className="w-4 h-4 mr-1.5" />
          {t("filter")}
          {hasActiveFilters && (
            <span className="ml-1.5 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {Object.values(filter).filter((v) => v !== undefined && v !== "").length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange({})}
            className="text-muted-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            {t("clearFilter")}
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {t("totalRecords", { count: pagination.total })}
        </span>
      </div>

      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("assetClass")}
                </label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filter.asset_class ?? ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      asset_class: (e.target.value || undefined) as TransactionFilter["asset_class"],
                    })
                  }
                >
                  <option value="">{t("all")}</option>
                  {ASSET_CLASSES.map((ac) => (
                    <option key={ac} value={ac}>
                      {ASSET_CLASS_LABELS[ac].zh}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("exchange")}
                </label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filter.exchange ?? ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      exchange: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">{t("all")}</option>
                  {EXCHANGES.map((ex) => (
                    <option key={ex} value={ex}>
                      {EXCHANGE_LABELS[ex]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("dateFrom")}
                </label>
                <input
                  type="date"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filter.date_from ?? ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      date_from: e.target.value || undefined,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {t("dateTo")}
                </label>
                <input
                  type="date"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={filter.date_to ?? ""}
                  onChange={(e) =>
                    onFilterChange({
                      ...filter,
                      date_to: e.target.value || undefined,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 表格 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  className="text-left py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("transacted_at")}
                >
                  <div className="flex items-center gap-1">
                    {t("time")}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  {t("symbol")}
                </th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                  {t("side")}
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("price")}
                >
                  <div className="flex items-center justify-end gap-1">
                    {t("price")}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  {t("quantity")}
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort("quote_quantity")}
                >
                  <div className="flex items-center justify-end gap-1">
                    {t("total")}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                  {t("commission")}
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  {t("exchange")}
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    {t("loading")}
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(tx.transacted_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{tx.symbol}</span>
                        {tx.asset_name && (
                          <span className="text-xs text-muted-foreground">
                            {tx.asset_name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          tx.side === "BUY"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {t(tx.side === "BUY" ? "buy" : "sell")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatNumber(tx.price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatNumber(tx.quantity, 4)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {formatNumber(tx.quote_quantity)}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                      {formatNumber(tx.commission)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs font-medium">
                        {EXCHANGE_LABELS[tx.exchange] ?? tx.exchange}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          onClick={() => onEdit(tx)}
                          title={t("edit")}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-muted-foreground hover:text-red-600"
                          onClick={() => onDelete(tx.id)}
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

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {t("page", { current: pagination.page, total: totalPages })}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={pagination.page >= totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
