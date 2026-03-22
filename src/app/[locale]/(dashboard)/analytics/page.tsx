"use client";

import { useState, useMemo, lazy, Suspense } from "react";
import { useTranslations } from "next-intl";
import { usePortfolioStats } from "@/hooks/use-portfolio-stats";
import { useAssets } from "@/hooks/use-assets";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon, BarChart3 } from "lucide-react";

// Lazy load unified chart components
const PerformanceChart = lazy(() => import("@/components/charts/performance-chart"));
const AllocationChart = lazy(() => import("@/components/charts/allocation-chart"));
const MonthlyPnlChart = lazy(() => import("@/components/charts/monthly-pnl"));

// Wrapper for charts in the grid
const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  color,
  children,
  height,
}: {
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
  height: number;
}) => (
  <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-sm overflow-hidden">
    <div className={`h-1 ${color} w-full`} />
    <CardHeader className="pb-2 pt-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-lg border ${color.replace("bg-", "border-").replace("/20", "/10")}`}
          >
            <Icon className={`w-3.5 h-3.5 ${color.replace("bg-", "text-").replace("/20", "")}`} />
          </div>
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {title}
          </CardTitle>
        </div>
        {subtitle && (
          <span className="text-[8px] font-black py-0.5 px-2 bg-slate-100 text-slate-400 rounded-full tracking-widest uppercase">
            {subtitle}
          </span>
        )}
      </div>
    </CardHeader>
    <CardContent style={{ height }} className="px-4 pt-4">
      {children}
    </CardContent>
  </Card>
);

// Loading component for charts
const ChartPlaceholder = ({ height }: { height: number }) => (
  <Skeleton className="w-full rounded-2xl" style={{ height }} />
);

type Timeframe = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";

export default function AnalyticsPage() {
  const tNav = useTranslations("Nav");
  const { stats, loading: isStatsLoading } = usePortfolioStats();
  const { assets, loading: isAssetsLoading } = useAssets();

  const [timeframe, setTimeframe] = useState<Timeframe>("ALL");

  const filteredPnl = useMemo(() => {
    if (!stats.cumulativePnl || stats.cumulativePnl.length === 0) return [];
    if (timeframe === "ALL") return stats.cumulativePnl;

    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case "1W":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6M":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const startStr = startDate.toISOString().slice(0, 10);
    return stats.cumulativePnl.filter((d) => d.date >= startStr);
  }, [stats.cumulativePnl, timeframe]);

  // Map data to match chart component requirements
  const performanceData = useMemo(() => {
    return filteredPnl.map((d) => ({
      date: d.date,
      profit: 0, // Not explicitly available from cumulative stats here
      cumulativeProfit: d.value,
    }));
  }, [filteredPnl]);

  const monthlyPnlData = useMemo(() => {
    return stats.monthlyReturns.map((d) => ({
      month: d.month,
      profit: d.pnl,
    }));
  }, [stats.monthlyReturns]);

  if (isStatsLoading || isAssetsLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">加载分析数据中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{tNav("analytics")}</h1>

        {/* Timeframe Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full overflow-x-auto text-xs font-medium">
          {(["1W", "1M", "3M", "6M", "YTD", "1Y", "ALL"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                timeframe === tf
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        <div className="lg:col-span-2">
          <ChartCard
            title="累计盈亏对比"
            subtitle="Performance"
            icon={TrendingUp}
            color="bg-primary/20"
            height={320}
          >
            <Suspense fallback={<ChartPlaceholder height={280} />}>
              <PerformanceChart data={performanceData} />
            </Suspense>
          </ChartCard>
        </div>

        <ChartCard title="资产配置权重" icon={PieIcon} color="bg-green-500/20" height={280}>
          <Suspense fallback={<ChartPlaceholder height={240} />}>
            <AllocationChart assets={assets} />
          </Suspense>
        </ChartCard>

        <ChartCard title="月度收益分布" icon={BarChart3} color="bg-amber-500/20" height={280}>
          <Suspense fallback={<ChartPlaceholder height={240} />}>
            <MonthlyPnlChart data={monthlyPnlData} />
          </Suspense>
        </ChartCard>
      </div>
    </div>
  );
}
