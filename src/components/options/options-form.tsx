"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { OptionInsertParams } from "@/lib/options";

interface OptionsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: OptionInsertParams) => Promise<boolean>;
}

export function OptionsForm({ open, onOpenChange, onSubmit }: OptionsFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [underlyingSymbol, setUnderlyingSymbol] = useState("");
  const [optionType, setOptionType] = useState<"CALL" | "PUT">("CALL");
  const [strikePrice, setStrikePrice] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [premium, setPremium] = useState("");
  const [contracts, setContracts] = useState("1");
  const [multiplier, setMultiplier] = useState("100");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setUnderlyingSymbol("");
    setOptionType("CALL");
    setStrikePrice("");
    setExpiryDate("");
    setPremium("");
    setContracts("1");
    setMultiplier("100");
    setNotes("");
    setError(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!underlyingSymbol || !strikePrice || !expiryDate || !premium || !contracts) {
        throw new Error("请填写所有必填字段");
      }

      const strike = parseFloat(strikePrice);
      const px = parseFloat(premium);
      const qty = parseInt(contracts, 10);
      const mult = parseInt(multiplier, 10) || 100;

      if (strike <= 0 || px <= 0 || qty <= 0) {
        throw new Error("数值必须大于 0");
      }

      const success = await onSubmit({
        underlying_symbol: underlyingSymbol.toUpperCase(),
        option_type: optionType,
        strike_price: strike,
        expiry_date: expiryDate,
        premium: px,
        contracts: qty,
        multiplier: mult,
        notes: notes || undefined,
      });

      if (success) {
        resetForm();
        onOpenChange(false);
      } else {
        setError("保存失败，请重试");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>录入期权记录</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 rounded-md border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="underlying_symbol">标的代码 *</Label>
              <Input
                id="underlying_symbol"
                placeholder="例如: AAPL"
                className="uppercase"
                value={underlyingSymbol}
                onChange={(e) => setUnderlyingSymbol(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>期权类型 *</Label>
              <div className="flex items-center gap-4 h-9">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="option_type"
                    value="CALL"
                    checked={optionType === "CALL"}
                    onChange={() => setOptionType("CALL")}
                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-medium text-sm text-emerald-600">CALL</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="option_type"
                    value="PUT"
                    checked={optionType === "PUT"}
                    onChange={() => setOptionType("PUT")}
                    className="w-4 h-4 text-rose-600 bg-slate-100 border-slate-300 focus:ring-rose-500"
                  />
                  <span className="font-medium text-sm text-rose-600">PUT</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strike_price">行权价格 *</Label>
              <Input
                id="strike_price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="例如: 150"
                value={strikePrice}
                onChange={(e) => setStrikePrice(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry_date">到期日 *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="premium">单价 *</Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contracts">数量 *</Label>
              <Input
                id="contracts"
                type="number"
                step="1"
                min="1"
                value={contracts}
                onChange={(e) => setContracts(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multiplier">乘数 *</Label>
              <Input
                id="multiplier"
                type="number"
                step="1"
                min="1"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注 (可选)</Label>
            <Input
              id="notes"
              placeholder="记录您的交易逻辑..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存记录"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
