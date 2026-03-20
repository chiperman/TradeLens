"use client";

import { useState, useMemo, useEffect } from "react";
import { calculateBreakEven, calculateNetProfit } from "@/lib/calculator";
import { useBinancePrice } from "@/hooks/use-binance-price";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTradeHistory } from "@/hooks/use-trade-history";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { useAssets } from "@/hooks/use-assets";
import { createClient } from "@/lib/supabase";
import { type User } from "@supabase/supabase-js";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Radio, Save, History, User as UserIcon, Coins, Activity, Trash2 } from "lucide-react";
import { AuthComponent } from "@/components/auth-component";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default function CalculatorPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // Binance Real-time Price Hook
  const { price: livePrice, isConnected } = useBinancePrice("BTCUSDT");

  // Exchange Rate Hook
  const { rate: cnyRate, isLoading: isRateLoading } = useExchangeRate();

  // LocalStorage Persisted State for Fees
  const [makerFee, setMakerFee] = useLocalStorage<string>("tradelens_maker_fee", "0.1");
  const [takerFee, setTakerFee] = useLocalStorage<string>("tradelens_taker_fee", "0.1");

  // Normal Input States
  const [buyPrice, setBuyPrice] = useState<string>("60000");
  const [quantity, setQuantity] = useState<string>("1");
  const [sellPrice, setSellPrice] = useState<string>("61000");

  // Trade History Hook
  const { history, saveCalculation, deleteCalculation, exportToExcel, exportToJSON } = useTradeHistory();

  // Asset Summary Hook
  const { assets, loading: isAssetsLoading } = useAssets();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  const syncLivePrice = () => {
    if (livePrice) setBuyPrice(livePrice.toString());
  };

  const breakEvenResult = useMemo(() => {
    const bPrice = parseFloat(buyPrice);
    const qty = parseFloat(quantity);
    const mFee = parseFloat(makerFee) / 100;
    const tFee = parseFloat(takerFee) / 100;

    if (isNaN(bPrice) || isNaN(qty) || isNaN(mFee) || isNaN(tFee)) return 0;
    return calculateBreakEven({
      buyPrice: bPrice,
      quantity: qty,
      makerFeeRate: mFee,
      takerFeeRate: tFee,
    });
  }, [buyPrice, quantity, makerFee, takerFee]);

  const profitResult = useMemo(() => {
    const bPrice = parseFloat(buyPrice);
    const sPrice = parseFloat(sellPrice);
    const qty = parseFloat(quantity);
    const mFee = parseFloat(makerFee) / 100;
    const tFee = parseFloat(takerFee) / 100;

    if (isNaN(bPrice) || isNaN(sPrice) || isNaN(qty) || isNaN(mFee) || isNaN(tFee))
      return { profit: 0, fees: 0 };
    return calculateNetProfit(bPrice, sPrice, qty, tFee, mFee);
  }, [buyPrice, sellPrice, quantity, makerFee, takerFee]);

  const handleSave = async (type: "break_even" | "profit") => {
    if (!user) {
      alert("请先登录以保存记录");
      return;
    }

    const res = await saveCalculation({
      buy_price: parseFloat(buyPrice),
      sell_price: type === "profit" ? parseFloat(sellPrice) : undefined,
      quantity: parseFloat(quantity),
      profit: type === "profit" ? profitResult.profit : undefined,
      fees:
        type === "profit"
          ? profitResult.fees
          : parseFloat(buyPrice) * parseFloat(quantity) * (parseFloat(takerFee) / 100),
      type,
    });

    if (res.error) alert(res.error);
    else alert("已保存至历史账本");
  };

  return (
    <main className="container mx-auto py-10 px-4 max-w-2xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl font-bold tracking-tight">TradeLens</h1>
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isConnected
                    ? "bg-green-500/10 text-green-600 border-green-500/20"
                    : "bg-red-500/10 text-red-600 border-red-500/20"
                }`}
              >
                <Radio className={`w-3 h-3 ${isConnected ? "animate-pulse" : ""}`} />
                {isConnected ? "Binance Live" : "Offline"}
              </div>
              {cnyRate && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Coins className="w-3 h-3" />
                  USD/CNY: {cnyRate.toFixed(2)}
                </div>
              )}
            </div>
            <p className="text-muted-foreground text-sm">精准测算波段交易的真实盈亏与保本价</p>
          </div>
          <div className="flex items-center gap-2">
            <AuthComponent />
          </div>
        </div>

        {/* 基础参数卡片 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">交易参数配置</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={syncLivePrice}
                disabled={!isConnected}
                className="gap-2 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                同步市价: {livePrice?.toFixed(1) || "---"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="buyPrice" className="text-xs">
                买入价 (USDT)
              </Label>
              <Input
                id="buyPrice"
                type="number"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs">
                数量
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="takerFee" className="text-xs">
                买入费率 (%)
              </Label>
              <Input
                id="takerFee"
                type="number"
                step="0.01"
                value={takerFee}
                onChange={(e) => setTakerFee(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="makerFee" className="text-xs">
                卖出费率 (%)
              </Label>
              <Input
                id="makerFee"
                type="number"
                step="0.01"
                value={makerFee}
                onChange={(e) => setMakerFee(e.target.value)}
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* 计算器 & 分析 Tabs */}
        <Tabs defaultValue="break-even" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="break-even">保本预测</TabsTrigger>
            <TabsTrigger value="profit">盈亏复盘</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <Activity className="w-3.5 h-3.5" />
              智能分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="break-even">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">实时保本点</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                <div className="text-center">
                  <p className="text-5xl font-mono font-black tracking-tight text-primary">
                    {breakEvenResult.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3 uppercase tracking-widest font-bold">
                    Target Break-even Price
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => handleSave("break_even")}
                  className="text-primary/60 hover:text-primary gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> 保存此保本目标
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="profit">
            <Card className="border-green-500/20 bg-green-500/5">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sellPrice" className="text-xs">
                    拟卖出价 (USDT)
                  </Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="h-9 border-green-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background/50 p-4 rounded-xl text-center border border-green-500/10">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                      净利润 (Net P&L)
                    </p>
                    <p
                      className={`text-2xl font-black mt-1 ${profitResult.profit >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {profitResult.profit >= 0 ? "+" : ""}
                      {profitResult.profit.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-xl text-center border border-muted">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                      手续费损耗
                    </p>
                    <p className="text-2xl font-bold mt-1 text-muted-foreground">
                      {profitResult.fees.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleSave("profit")}
                  className="w-full bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Save className="w-4 h-4" /> 记录此笔成交
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 资产持仓概览 */}
        {user && (
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-500" />
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  资产组合概览
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-0 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {isAssetsLoading ? (
                <div className="col-span-full py-4 text-center text-xs text-muted-foreground">加载持仓中...</div>
              ) : assets.length > 0 ? (
                assets.map((asset) => (
                  <div key={asset.base_asset} className="bg-muted/30 p-3 rounded-xl border border-muted-foreground/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{asset.base_asset}</p>
                    <p className="text-lg font-mono font-black mt-0.5">
                      {asset.total_quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Avg: ${asset.average_price.toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-xs text-muted-foreground border-2 border-dashed rounded-xl">
                  暂无持仓数据，请同步 Binance 交易
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 历史账本简报 */}
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  最近计算历史
                </CardTitle>
              </div>
              {user && history.length > 0 && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={exportToExcel} className="h-7 text-[10px] font-bold uppercase gap-1">
                    Excel
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportToJSON} className="h-7 text-[10px] font-bold uppercase gap-1">
                    JSON
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-0 space-y-2">
            {history.length > 0 ? (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 rounded-lg bg-muted/40 text-sm border border-transparent hover:border-muted-foreground/10 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-mono font-bold">
                      {item.buy_price} → {item.sell_price || "---"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(item.created_at!).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p
                        className={`font-bold ${item.profit && item.profit > 0 ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {item.profit
                          ? `${item.profit.toFixed(2)} USDT`
                          : item.type === "break_even"
                            ? "保本记录"
                            : "---"}
                      </p>
                    </div>
                    {user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          if (confirm("确定要删除这条记录吗？")) {
                            const res = await deleteCalculation(item.id!);
                            if (res.error) alert(res.error);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground text-xs">
                {user ? "暂无历史记录" : "登录后可同步云端账本"}
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="text-center py-6 text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Powered by TradeLens Core v0.2
        </footer>
      </div>
    </main>
  );
}
