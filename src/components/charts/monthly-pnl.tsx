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

interface MonthlyPnlData {
  month: string;
  profit: number;
}

interface MonthlyPnlChartProps {
  data: MonthlyPnlData[];
}

export default function MonthlyPnlChart({ data }: MonthlyPnlChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
        暂无月度数据数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
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
          cursor={{ fill: "#f8fafc" }}
        />
        <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
