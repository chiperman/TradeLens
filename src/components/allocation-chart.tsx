"use client";

import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { type AssetSummary } from "@/hooks/use-assets";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface AllocationChartProps {
  assets: AssetSummary[];
}

export default function AllocationChart({ assets }: AllocationChartProps) {
  if (assets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[9px] font-black uppercase tracking-[0.2em] text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
        无持仓资产
      </div>
    );
  }

  return (
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
          {assets.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className="hover:opacity-80 transition-opacity outline-none"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            fontSize: "10px",
            fontWeight: "bold",
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{
            fontSize: "9px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
          iconType="circle"
          iconSize={6}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
