"use client";

import { useOptions } from "@/hooks/use-options";
import type { OptionStatus } from "@/lib/options";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CircleDashed, XOctagon, ArrowRightCircle, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface OptionsListProps {
  filterStatus?: OptionStatus | "ALL";
}

export function OptionsList({ filterStatus = "ALL" }: OptionsListProps) {
  const { positions, loading, updatePosition } = useOptions();

  // Close Position Modal State
  const [closingId, setClosingId] = useState<string | null>(null);
  const [closePremium, setClosePremium] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered =
    filterStatus === "ALL" ? positions : positions.filter((p) => p.status === filterStatus);

  if (loading) {
    return <div className="text-center py-10 text-slate-500 text-sm">加载期权数据中...</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed rounded-lg bg-slate-50/50">
        <p className="text-sm text-slate-500">无期权记录</p>
      </div>
    );
  }

  const getStatusIcon = (status: OptionStatus) => {
    switch (status) {
      case "OPEN":
        return <CircleDashed className="w-4 h-4 text-amber-500" />;
      case "CLOSED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "EXERCISED":
        return <ArrowRightCircle className="w-4 h-4 text-blue-500" />;
      case "EXPIRED":
        return <XOctagon className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBg = (status: OptionStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-50 text-amber-600 border-amber-200";
      case "CLOSED":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "EXERCISED":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "EXPIRED":
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  const handleExercise = async (id: string) => {
    if (confirm("确定要行权该期权吗？这会自动将其标记为 EXERCISED 状态。")) {
      await updatePosition(id, { status: "EXERCISED" });
    }
  };

  const handleExpire = async (id: string) => {
    if (confirm("确定要作废该期权吗？这会自动将其标记为 EXPIRED 状态，产生全额浮亏。")) {
      await updatePosition(id, { status: "EXPIRED" });
    }
  };

  const submitClosePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!closingId || !closePremium) return;
    setIsSubmitting(true);
    try {
      await updatePosition(closingId, {
        status: "CLOSED",
        close_premium: parseFloat(closePremium),
      });
      setClosingId(null);
      setClosePremium("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {filtered.map((pos) => {
        const totalCost = pos.premium * pos.contracts * pos.multiplier;
        const totalClose = pos.close_premium
          ? pos.close_premium * pos.contracts * pos.multiplier
          : 0;
        const pnl =
          pos.status === "EXPIRED" ? -totalCost : pos.close_premium ? totalClose - totalCost : 0;

        return (
          <Card
            key={pos.id}
            className="overflow-hidden border-slate-200/60 shadow-sm transition-all hover:shadow-md"
          >
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                {/* Left: Identifier */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className={`p-2.5 rounded-xl border ${getStatusBg(pos.status)}`}>
                    {getStatusIcon(pos.status)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{pos.underlying_symbol}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider ${pos.option_type === "CALL" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                      >
                        {pos.option_type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      ${pos.strike_price.toFixed(2)} | Exp: {pos.expiry_date}
                    </div>
                  </div>
                </div>

                {/* Middle: Specs */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm flex-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 mb-0.5">单价 (Premium)</span>
                    <span className="font-mono font-medium">${pos.premium.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 mb-0.5">数量 (Size)</span>
                    <span className="font-mono">
                      {pos.contracts} (x{pos.multiplier})
                    </span>
                  </div>
                  <div className="flex flex-col col-span-2 sm:col-span-1">
                    <span className="text-xs text-slate-400 mb-0.5">开仓日期</span>
                    <span className="font-mono text-slate-600">{pos.opened_at.split("T")[0]}</span>
                  </div>
                </div>

                {/* Right: PNL & Total */}
                <div className="flex flex-col items-end min-w-[120px]">
                  <span className="text-xs text-slate-400 mb-0.5">成本空间</span>
                  <span className="font-bold font-mono text-slate-800">
                    ${totalCost.toFixed(2)}
                  </span>
                  {pos.status !== "OPEN" && (
                    <div
                      className={`text-xs font-bold font-mono mt-0.5 ${pnl >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      PNL: {pnl >= 0 ? "+" : ""}
                      {pnl.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Actions Menu */}
                {pos.status === "OPEN" && (
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[120px]">
                        <DropdownMenuItem
                          onClick={() => setClosingId(pos.id)}
                          className="text-emerald-600 font-medium"
                        >
                          平仓 (Close)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExercise(pos.id)}
                          className="text-blue-600 font-medium"
                        >
                          行权 (Exercise)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleExpire(pos.id)}
                          className="text-slate-600 font-medium"
                        >
                          作废 (Expire)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* 平仓弹窗 */}
      <Dialog open={!!closingId} onOpenChange={(v) => !v && setClosingId(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>期权平仓</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitClosePosition} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="close_premium">平仓单价 (Premium)</Label>
              <Input
                id="close_premium"
                type="number"
                step="0.01"
                min="0.01"
                value={closePremium}
                onChange={(e) => setClosePremium(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setClosingId(null)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "处理中..." : "确认平仓"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
