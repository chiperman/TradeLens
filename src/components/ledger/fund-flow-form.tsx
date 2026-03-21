"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  type FundFlowFormData,
  EXCHANGES,
  FUND_DIRECTIONS,
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

interface FundFlowFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FundFlowFormData) => Promise<void>;
}

export function FundFlowForm({ open, onOpenChange, onSubmit }: FundFlowFormProps) {
  const t = useTranslations("Ledger");

  const now = new Date();
  const localISOString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const [formData, setFormData] = useState<FundFlowFormData>({
    exchange: "binance",
    direction: "deposit",
    amount: 0,
    currency: "USD",
    notes: "",
    transacted_at: localISOString,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("addFundFlow")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 方向 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("direction")}</Label>
            <div className="flex gap-1">
              {FUND_DIRECTIONS.map((dir) => (
                <button
                  key={dir}
                  type="button"
                  className={`flex-1 h-9 rounded-md text-sm font-medium transition-colors ${
                    formData.direction === dir
                      ? dir === "deposit"
                        ? "bg-emerald-600 text-white"
                        : "bg-orange-600 text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, direction: dir }))
                  }
                >
                  {t(dir)}
                </button>
              ))}
            </div>
          </div>

          {/* 金额 + 币种 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">{t("amount")}</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("currency")}</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={formData.currency}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currency: e.target.value }))
                }
              >
                <option value="USD">USD</option>
                <option value="CNY">CNY</option>
                <option value="HKD">HKD</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>

          {/* 交易所 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("exchange")}</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={formData.exchange}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  exchange: e.target.value as FundFlowFormData["exchange"],
                }))
              }
            >
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>
                  {EXCHANGE_LABELS[ex]}
                </option>
              ))}
            </select>
          </div>

          {/* 时间 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("time")}</Label>
            <Input
              type="datetime-local"
              value={formData.transacted_at}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  transacted_at: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* 备注 */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("notes")}</Label>
            <Input
              placeholder={t("notesPlaceholder")}
              value={formData.notes ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 text-sm">
              {error}
            </div>
          )}

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
              {submitting ? t("saving") : t("addFundFlow")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
