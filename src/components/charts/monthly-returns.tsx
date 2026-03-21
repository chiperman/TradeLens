"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export interface MonthlyReturnsProps {
  data: { month: string; pnl: number }[];
  height?: number;
}

export function MonthlyReturnsChart({ data, height = 280 }: MonthlyReturnsProps) {
  return (
    <Card className="shadow-lg border-none bg-white">
      <CardHeader className="pb-2 pt-6 px-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-purple-50 rounded-lg">
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <CardTitle className="text-sm font-bold text-slate-700">月度收益</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4" style={{ height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="pnl" radius={[4, 4, 4, 4]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 border border-dashed rounded-lg">
            暂无月度收益数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}
