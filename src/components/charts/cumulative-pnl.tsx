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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export interface CumulativePnlProps {
  data: { date: string; value: number }[];
  height?: number;
}

export function CumulativePnlChart({ data, height = 280 }: CumulativePnlProps) {
  return (
    <Card className="shadow-lg border-none bg-white">
      <CardHeader className="pb-2 pt-6 px-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <CardTitle className="text-sm font-bold text-slate-700">累计盈亏曲线</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4" style={{ height }}>
        {data.length > 0 ? (
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
                itemStyle={{ color: "#3b82f6" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorProfit)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 border border-dashed rounded-lg">
            暂无数据
          </div>
        )}
      </CardContent>
    </Card>
  );
}
