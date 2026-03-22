"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useAssets } from "@/hooks/use-assets";
import { usePortfolioStats } from "@/hooks/use-portfolio-stats";
import dynamic from "next/dynamic";
const PerformanceChart = dynamic(() => import("@/components/performance-chart"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-100 w-full h-full rounded-2xl" />,
});
const AllocationChart = dynamic(() => import("@/components/allocation-chart"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-100 w-full h-full rounded-2xl" />,
});
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Activity,
  Target,
  BarChart3,
  Shield,
} from "lucide-react";

function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-3 h-3" />
        </div>
        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-xl font-mono font-black text-slate-900 leading-none">{value}</p>
        {suffix && <span className="text-[10px] font-bold text-slate-300">{suffix}</span>}
      </div>
    </div>
  );
}

export function AnalyticsDashboard() {
  const { timeSeries, loading: isTimeLoading } = useAnalytics();
  const { assets, loading: isAssetsLoading } = useAssets();
  const { stats, loading: isStatsLoading } = usePortfolioStats();

  if (isTimeLoading || isAssetsLoading || isStatsLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">正在聚合分析数据...</div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* KPI 卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="总已实现 P&L"
          value={
            stats.totalPnl >= 0
              ? `+$${stats.totalPnl.toFixed(2)}`
              : `-$${Math.abs(stats.totalPnl).toFixed(2)}`
          }
          icon={stats.totalPnl >= 0 ? TrendingUp : TrendingDown}
          color={stats.totalPnl >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}
        />
        <KpiCard
          label="总收益率"
          value={(stats.totalReturn * 100).toFixed(2)}
          suffix="%"
          icon={BarChart3}
          color="bg-blue-50 text-blue-600"
        />
        <KpiCard
          label="胜率"
          value={(stats.winRatePct * 100).toFixed(1)}
          suffix="%"
          icon={Target}
          color="bg-amber-50 text-amber-600"
        />
        <KpiCard
          label="盈亏比"
          value={stats.plRatio.toFixed(2)}
          icon={Activity}
          color="bg-purple-50 text-purple-600"
        />
        <KpiCard
          label="最大回撤"
          value={(stats.maxDrawdownPct * 100).toFixed(2)}
          suffix="%"
          icon={Shield}
          color="bg-red-50 text-red-500"
        />
        <KpiCard
          label="夏普比率"
          value={stats.sharpe.toFixed(2)}
          icon={Activity}
          color="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          label="总入金"
          value={`$${stats.totalDeposits.toFixed(0)}`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="交易总数"
          value={String(stats.tradeCount)}
          icon={BarChart3}
          color="bg-sky-50 text-sky-600"
        />
      </div>

      {/* 盈亏曲线图 */}
      <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="h-1 bg-primary/20 w-full" />
        <CardHeader className="pb-2 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                累计盈亏曲线 (P&L Curve)
              </CardTitle>
            </div>
            <span className="text-[8px] font-black py-0.5 px-2 bg-slate-100 text-slate-400 rounded-full tracking-widest uppercase">
              Performance
            </span>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-6 px-4">
          <PerformanceChart data={timeSeries} />
        </CardContent>
      </Card>

      {/* 资产分布 */}
      <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white overflow-hidden">
        <div className="h-1 bg-green-500/20 w-full" />
        <CardHeader className="pb-2 pt-6 px-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-green-50 rounded-lg border border-green-100">
              <PieIcon className="w-3.5 h-3.5 text-green-500" />
            </div>
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              资产配置权重
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[250px] w-full p-4">
          <AllocationChart assets={assets} />
        </CardContent>
      </Card>
    </div>
  );
}
