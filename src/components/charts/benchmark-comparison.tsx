"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

export interface BenchmarkComparisonProps {
  data: { date: string; portfolioReturn: number; benchmarkReturn: number }[];
  height?: number;
}

export function BenchmarkComparisonChart({ data, height = 280 }: BenchmarkComparisonProps) {
  return (
    <Card className="shadow-lg border-none bg-white">
      <CardHeader className="pb-2 pt-6 px-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <CardTitle className="text-sm font-bold text-slate-700">
            收益率对比 (vs S&P 500)
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4" style={{ height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(val: any) => {
                  const num = Number(val);
                  return !isNaN(num) ? [`${(num * 100).toFixed(2)}%`] : [val];
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="portfolioReturn"
                name="我的投资组合"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="benchmarkReturn"
                name="S&P 500"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 border border-dashed rounded-lg">
            暂无对比数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}
