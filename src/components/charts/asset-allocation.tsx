"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieIcon } from "lucide-react";

export interface AssetAllocationProps {
  data: { base_asset: string; total_cost: number }[];
  height?: number;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f43f5e",
];

export function AssetAllocationChart({ data, height = 250 }: AssetAllocationProps) {
  return (
    <Card className="shadow-lg border-none bg-white">
      <CardHeader className="pb-2 pt-6 px-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-green-50 rounded-lg">
            <PieIcon className="w-4 h-4 text-green-500" />
          </div>
          <CardTitle className="text-sm font-bold text-slate-700">资产配置权重</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4" style={{ height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total_cost"
                nameKey="base_asset"
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400 border border-dashed rounded-lg">
            无持仓资产
          </div>
        )}
      </CardContent>
    </Card>
  );
}
