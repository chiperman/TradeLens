import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface OptionsPayoffProps {
  strike: number;
  premium: number;
  type: "CALL" | "PUT";
  contracts: number;
  multiplier?: number;
}

export function OptionsPayoffDiagram({
  strike,
  premium,
  type,
  contracts,
  multiplier = 100,
}: OptionsPayoffProps) {
  const chartData = useMemo(() => {
    if (!strike || strike <= 0 || !premium || premium <= 0) return [];

    // Generate an array of spot prices around the strike price
    // Range depends on the strike price (e.g. +/- 20%)
    const minSpot = Math.max(0, strike * 0.7);
    const maxSpot = strike * 1.3;
    const step = (maxSpot - minSpot) / 40;

    const data = [];
    for (let currentSpot = minSpot; currentSpot <= maxSpot; currentSpot += step) {
      const spot = parseFloat(currentSpot.toFixed(2));
      let pnlPerShare = 0;

      if (type === "CALL") {
        pnlPerShare = Math.max(0, spot - strike) - premium;
      } else {
        pnlPerShare = Math.max(0, strike - spot) - premium;
      }

      const totalPnl = parseFloat((pnlPerShare * contracts * multiplier).toFixed(2));
      data.push({ spot, pnl: totalPnl });
    }

    return data;
  }, [strike, premium, type, contracts, multiplier]);

  // Break-even
  const breakEven = type === "CALL" ? strike + premium : strike - premium;
  const maxLoss = premium * contracts * multiplier;

  if (chartData.length === 0) {
    return (
      <Card className="h-64 flex flex-col items-center justify-center bg-slate-50/50 border-dashed border-slate-200">
        <p className="text-sm text-slate-400">请输入完整的期权参数以渲染盈亏图表</p>
      </Card>
    );
  }

  // Determine positive/negative areas using split colors
  const gradientOffset = () => {
    const dataMax = Math.max(...chartData.map((i) => i.pnl));
    const dataMin = Math.min(...chartData.map((i) => i.pnl));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  return (
    <Card className="overflow-hidden border-slate-200/60 shadow-sm relative pt-4">
      {/* 顶部数据展示 */}
      <div className="px-6 flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">到期盈亏表现 (Payoff at Expiration)</h3>
          <p className="text-xs text-slate-500 mt-1">
            最大亏损: <span className="font-mono text-rose-500">-${maxLoss.toFixed(2)}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">保本价 (Break-even):</span>
          <div className="text-lg font-bold font-mono text-emerald-600">
            ${breakEven.toFixed(2)}
          </div>
        </div>
      </div>

      <CardContent className="p-0 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="spot"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(val) => `$${val.toFixed(0)}`}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(val) => `${val > 0 ? "+" : ""}$${val}`}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
                fontWeight: 500,
              }}
              labelFormatter={(val) => `到期市价: $${Number(val).toFixed(2)}`}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [
                <span key="1" className={Number(val) >= 0 ? "text-emerald-500" : "text-rose-500"}>
                  {Number(val) >= 0 ? "+" : ""}${Number(val).toFixed(2)}
                </span>,
                "盈亏",
              ]}
            />
            <defs>
              <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#10b981" stopOpacity={0.2} />
                <stop offset={off} stopColor="#f43f5e" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            {/* Zero Line */}
            <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} strokeDasharray="3 3" />
            {/* Strike Line */}
            <ReferenceLine x={strike} stroke="#94a3b8" strokeWidth={1} />
            {/* Break-even Line */}
            <ReferenceLine x={breakEven} stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" />

            <Area
              type="monotone"
              dataKey="pnl"
              stroke="#0f172a"
              strokeWidth={2}
              fill="url(#splitColor)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
