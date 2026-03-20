"use client";

import { useAnalytics } from "@/hooks/use-analytics";
import { useAssets } from "@/hooks/use-assets";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon, Activity } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function AnalyticsDashboard() {
  const { timeSeries, loading: isTimeLoading } = useAnalytics();
  const { assets, loading: isAssetsLoading } = useAssets();

  if (isTimeLoading || isAssetsLoading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">正在聚合分析数据...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 盈亏曲线图 */}
      <Card className="border border-muted/20 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">累计盈亏曲线 (P&L Curve)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="h-[250px] w-full pt-4">
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "#888" }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: "#888" }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#000000e0", border: "none", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground border-2 border-dashed rounded-xl">
              暂无历史交易数据以生成曲线
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 资产分布占比 */}
        <Card className="border border-muted/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-green-500" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">资产配置权重</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] w-full">
            {assets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assets}
                    dataKey="total_cost"
                    nameKey="base_asset"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                  >
                    {assets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground border-2 border-dashed rounded-xl">
                无持仓资产
              </div>
            )}
          </CardContent>
        </Card>

        {/* 关键性能指标 (KPI) */}
        <Card className="border border-muted/20 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-500" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">核心性能指标</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-xl">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">总胜率 (W/L)</p>
                <p className="text-2xl font-black mt-1">---</p>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">盈亏比</p>
                <p className="text-2xl font-black mt-1 text-primary">0.00</p>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">更多高级分析功能正在开发中...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
