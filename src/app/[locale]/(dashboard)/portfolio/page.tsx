"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useTransactions } from "@/hooks/use-transactions";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Coins, LayoutList } from "lucide-react";

export default function PortfolioPage() {
  const tNav = useTranslations("Nav");
  const { transactions, loading } = useTransactions();
  const [activeTab, setActiveTab] = useState<"crypto" | "stock">("crypto");

  // Calculate active positions
  const positions = useMemo(() => {
    if (!transactions) return [];

    const posMap = new Map<
      string,
      { symbol: string; qty: number; avgCost: number; assetClass: string; exchange: string }
    >();

    for (const tx of transactions) {
      const key = `${tx.symbol}:${tx.exchange}`;
      const pos = posMap.get(key) || {
        symbol: tx.symbol,
        qty: 0,
        avgCost: 0,
        assetClass: tx.asset_class,
        exchange: tx.exchange,
      };

      if (tx.side === "BUY") {
        const totalCost = pos.qty * pos.avgCost + tx.quantity * tx.price;
        pos.qty += tx.quantity;
        pos.avgCost = totalCost / pos.qty;
      } else {
        pos.qty -= tx.quantity;
      }

      posMap.set(key, pos);
    }

    return Array.from(posMap.values()).filter((p) => p.qty > 0.000001); // Filter out zero qty with float precision tolerance
  }, [transactions]);

  const filteredPositions = positions.filter((p) =>
    activeTab === "crypto" ? p.assetClass === "crypto" : p.assetClass === "stock"
  );

  if (loading) {
    return <div className="py-20 text-center text-sm text-muted-foreground">加载持仓数据中...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{tNav("portfolio")}</h1>

        {/* Market Class Toggles */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-sm font-medium">
          <button
            onClick={() => setActiveTab("crypto")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "crypto"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Coins className="w-4 h-4" />
            Crypto
          </button>
          <button
            onClick={() => setActiveTab("stock")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === "stock"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Stock
          </button>
        </div>
      </div>

      <Card className="shadow-lg border-none bg-white overflow-hidden">
        <div
          className={`h-1 w-full ${activeTab === "crypto" ? "bg-amber-400/50" : "bg-blue-500/50"}`}
        />
        <CardContent className="p-0">
          {filteredPositions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-bold">
                      标的 (Symbol)
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold">
                      数量 (Qty)
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold">
                      持仓均价 (Avg Cost)
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold">
                      交易所 (Exchange)
                    </th>
                    <th scope="col" className="px-6 py-4 font-bold text-right">
                      总成本 (Total Cost)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPositions.map((pos, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{pos.symbol}</td>
                      <td className="px-6 py-4 font-mono">
                        {pos.qty.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">
                        ${pos.avgCost.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider">
                          {pos.exchange}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-700 text-right">
                        ${(pos.qty * pos.avgCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100">
                <Briefcase className="w-8 h-8 text-slate-300" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-500">
                  暂无 {activeTab === "crypto" ? "Crypto" : "Stock"} 持仓
                </h3>
                <p className="text-xs text-slate-400">进行交易以建立您的投资组合</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
