"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePortfolioStats } from "@/hooks/use-portfolio-stats";
import { useAssets } from "@/hooks/use-assets";
import { CumulativePnlChart } from "@/components/charts/cumulative-pnl";
import { AssetAllocationChart } from "@/components/charts/asset-allocation";
import { MonthlyReturnsChart } from "@/components/charts/monthly-returns";
import { BenchmarkComparisonChart } from "@/components/charts/benchmark-comparison";

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

  // Mock benchmark performance for P0 demonstration based on portfolio return trend
  const benchmarkData = useMemo(() => {
    return filteredPnl.map((d) => ({
      date: d.date,
      portfolioReturn: d.value / (stats.totalDeposits || 1), // Apprx return curve
      benchmarkReturn: (d.value / (stats.totalDeposits || 1)) * 0.6 + 0.05, // S&P proxy mock
    }));
  }, [filteredPnl, stats.totalDeposits]);

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <CumulativePnlChart data={filteredPnl} height={320} />
        </div>

        <AssetAllocationChart data={assets} height={280} />
        <MonthlyReturnsChart data={stats.monthlyReturns} height={280} />

        <div className="lg:col-span-2">
          <BenchmarkComparisonChart data={benchmarkData} height={320} />
        </div>
      </div>
    </div>
  );
}
