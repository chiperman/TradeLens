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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 盈亏曲线图 */}
      <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-sm overflow-hidden">
        <div className="h-1 bg-primary/20 w-full" />
        <CardHeader className="pb-2 pt-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">累计盈亏曲线 (P&L Curve)</CardTitle>
            </div>
            <span className="text-[8px] font-black py-0.5 px-2 bg-slate-100 text-slate-400 rounded-full tracking-widest uppercase">Performance</span>
          </div>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-6 px-4">
          {timeSeries.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: 700 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#ffffff", 
                    border: "1px solid #f1f5f9", 
                    borderRadius: "16px", 
                    fontSize: "10px", 
                    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.05)",
                    fontWeight: "bold"
                  }}
                  itemStyle={{ color: "#3b82f6", padding: "2px 0" }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeProfit"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
              暂无历史交易数据以生成曲线
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 资产分布占比 */}
        <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white overflow-hidden">
          <div className="h-1 bg-green-500/20 w-full" />
          <CardHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-green-50 rounded-lg border border-green-100">
                <PieIcon className="w-3.5 h-3.5 text-green-500" />
              </div>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">资产配置权重</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] w-full p-4">
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
                    outerRadius={85}
                    paddingAngle={8}
                    stroke="none"
                  >
                    {assets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: "16px", 
                      border: "none", 
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "10px",
                      fontWeight: "bold"
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    wrapperStyle={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }} 
                    iconType="circle"
                    iconSize={6}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                无持仓资产
              </div>
            )}
          </CardContent>
        </Card>

        {/* 关键性能指标 (KPI) */}
        <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white overflow-hidden">
          <div className="h-1 bg-orange-500/20 w-full" />
          <CardHeader className="pb-2 pt-6 px-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                <Activity className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">核心性能指标</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 px-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">总胜率 (W/L)</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-2xl font-mono font-black text-slate-900 leading-none">---</p>
                  <span className="text-[10px] font-bold text-slate-300">%</span>
                </div>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">盈亏比 (P/L)</p>
                <div className="flex items-baseline gap-1 mt-2">
                  <p className="text-2xl font-mono font-black text-blue-600 leading-none">0.00</p>
                </div>
              </div>
            </div>
            <div className="py-4 px-6 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
              <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-[0.2em] opacity-80">更多高级分析功能正在开发中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
