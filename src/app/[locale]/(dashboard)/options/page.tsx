"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Layers } from "lucide-react";
import { useOptions } from "@/hooks/use-options";
import { OptionsList } from "@/components/options/options-list";
import { OptionsForm } from "@/components/options/options-form";
import type { OptionStatus, OptionInsertParams } from "@/lib/options";

export default function OptionsPage() {
  const tNav = useTranslations("Nav");
  const { addPosition } = useOptions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filter, setFilter] = useState<OptionStatus | "ALL">("OPEN");

  const handleAddOption = async (params: OptionInsertParams) => {
    const result = await addPosition(params);
    return result.success;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            {tNav("options")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">管理您的期权投资组合并追踪盈亏表现</p>
        </div>

        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          新增期权记录
        </Button>
      </div>

      {/* 状态筛选 */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-lg w-fit text-sm font-medium">
        {(["ALL", "OPEN", "CLOSED", "EXERCISED", "EXPIRED"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-md transition-all ${
              filter === status
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* 列表区域 */}
      <div className="pt-2">
        <OptionsList filterStatus={filter} />
      </div>

      <OptionsForm open={isFormOpen} onOpenChange={setIsFormOpen} onSubmit={handleAddOption} />
    </div>
  );
}
