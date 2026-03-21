"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  type TransactionFormData,
  type Transaction,
  ASSET_CLASSES,
  EXCHANGES,
  TRADE_SIDES,
  ASSET_CLASS_LABELS,
  EXCHANGE_LABELS,
} from "@/types/transaction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  initialData?: Transaction | null;
}

export function TransactionForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: TransactionFormProps) {
  const t = useTranslations("Ledger");
  const isEditMode = !!initialData;

  const now = new Date();
  const localISOString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [formData, setFormData] = useState<TransactionFormData>({
    symbol: initialData?.symbol ?? "",
    asset_name: initialData?.asset_name ?? "",
    asset_class: initialData?.asset_class ?? "crypto",
    exchange: initialData?.exchange ?? "binance",
    side: initialData?.side ?? "BUY",
    price: initialData?.price ?? 0,
    quantity: initialData?.quantity ?? 0,
    commission: initialData?.commission ?? 0,
    notes: initialData?.notes ?? "",
    transacted_at: initialData?.transacted_at
      ? new Date(initialData.transacted_at).toISOString().slice(0, 16)
      : localISOString,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        ...formData,
        transacted_at: new Date(formData.transacted_at).toISOString(),
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof TransactionFormData>(
    key: K,
    value: TransactionFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t("editTransaction") : t("addTransaction")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 资产类别 + 交易方向 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("assetClass")}</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.asset_class}
                onChange={(e) =>
                  updateField(
                    "asset_class",
                    e.target.value as TransactionFormData["asset_class"]
                  )
                }
              >
                {ASSET_CLASSES.map((ac) => (
                  <option key={ac} value={ac}>
                    {ASSET_CLASS_LABELS[ac].zh}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("side")}</Label>
              <div className="flex gap-1">
                {TRADE_SIDES.map((side) => (
                  <button
                    key={side}
                    type="button"
                    className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                      formData.side === side
                        ? side === "BUY"
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600 text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => updateField("side", side)}
                  >
                    {t(side === "BUY" ? "buy" : "sell")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 标的信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("symbol")}</Label>
              <Input
                placeholder="AAPL / BTCUSDT"
                value={formData.symbol}
                onChange={(e) => updateField("symbol", e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("assetName")}</Label>
              <Input
                placeholder="Apple Inc."
                value={formData.asset_name ?? ""}
                onChange={(e) => updateField("asset_name", e.target.value)}
              />
            </div>
          </div>

          {/* 价格 + 数量 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("price")}</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={formData.price || ""}
                onChange={(e) => updateField("price", Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("quantity")}</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={formData.quantity || ""}
                onChange={(e) => updateField("quantity", Number(e.target.value))}
                required
              />
            </div>
          </div>

          {/* 成交额预览 */}
          {formData.price > 0 && formData.quantity > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">{t("total")}：</span>
              <span className="font-mono font-semibold">
                {(formData.price * formData.quantity).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}

          {/* 手续费 + 交易所 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("commission")}</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={formData.commission || ""}
                onChange={(e) => updateField("commission", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("exchange")}</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.exchange}
                onChange={(e) => updateField("exchange", e.target.value)}
              >
                {EXCHANGES.map((ex) => (
                  <option key={ex} value={ex}>
                    {EXCHANGE_LABELS[ex]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 交易时间 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("time")}</Label>
            <Input
              type="datetime-local"
              value={formData.transacted_at}
              onChange={(e) => updateField("transacted_at", e.target.value)}
              required
            />
          </div>

          {/* 备注 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("notes")}</Label>
            <Input
              placeholder={t("notesPlaceholder")}
              value={formData.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm">
              {error}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t("saving")
                : isEditMode
                  ? t("saveChanges")
                  : t("addTransaction")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
