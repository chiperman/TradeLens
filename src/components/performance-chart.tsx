"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { type TimeSeriesData } from "@/hooks/use-analytics";

interface PerformanceChartProps {
  data: TimeSeriesData[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
        暂无历史交易数据以生成曲线
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            fontWeight: "bold",
          }}
          itemStyle={{ color: "#3b82f6", padding: "2px 0" }}
          cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }}
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
  );
}
