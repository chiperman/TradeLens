"use client";

import { useState, useMemo, useEffect } from "react";
import { calculateAccumulation, calculateBreakEven, calculateNetProfit } from "@/lib/calculator";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { 
  RefreshCw, Radio, Save, History, User as UserIcon, Coins, Activity, 
  Trash2, TrendingUp, TrendingDown, ArrowRightLeft, Check, ChevronsUpDown, Search 
} from "lucide-react";
import { AuthComponent } from "@/components/auth-component";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { cn } from "@/lib/utils";

const popularSymbols = [
  { value: "BTCUSDT", label: "BTC/USDT" },
  { value: "ETHUSDT", label: "ETH/USDT" },
  { value: "SOLUSDT", label: "SOL/USDT" },
  { value: "BNBUSDT", label: "BNB/USDT" },
  { value: "DOGEUSDT", label: "DOGE/USDT" },
  { value: "XRPUSDT", label: "XRP/USDT" },
  { value: "PEPEUSDT", label: "PEPE/USDT" },
  { value: "ORDIUSDT", label: "ORDI/USDT" },
  { value: "TIAUSDT", label: "TIA/USDT" },
  { value: "SUIUSDT", label: "SUI/USDT" },
  { value: "OPUSDT", label: "OP/USDT" },
  { value: "ARBUSDT", label: "ARB/USDT" },
];

export default function CalculatorPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  // Symbol State
  const [symbol, setSymbol] = useLocalStorage<string>("tradelens_current_symbol", "BTCUSDT");
  const [symbolInput, setSymbolInput] = useState("");
  const [open, setOpen] = useState(false);

  // Derived Asset Names
  const baseAsset = useMemo(() => {
    if (symbol.endsWith("USDT")) return symbol.replace("USDT", "");
    if (symbol.endsWith("USDC")) return symbol.replace("USDC", "");
    if (symbol.endsWith("BNB")) return symbol.replace("BNB", "");
    if (symbol.endsWith("BTC")) return symbol.replace("BTC", "");
    return symbol.substring(0, symbol.length - 4); // Default fallback
  }, [symbol]);

  const quoteAsset = useMemo(() => {
    if (symbol.endsWith("USDT")) return "USDT";
    if (symbol.endsWith("USDC")) return "USDC";
    if (symbol.endsWith("BNB")) return "BNB";
    if (symbol.endsWith("BTC")) return "BTC";
    return symbol.substring(symbol.length - 4);
  }, [symbol]);

  // Binance Real-time Price Hook
  const { price: livePrice, isConnected } = useBinancePrice(symbol);

  // Exchange Rate Hook
  const { rate: cnyRate, isLoading: isRateLoading } = useExchangeRate();

  // LocalStorage Persisted State for Fees
  const [feeRate, setFeeRate] = useLocalStorage<string>("tradelens_global_fee", "0.1");

  // Core Input States
  const [sellPrice, setSellPrice] = useState<string>("70000");
  const [quantity, setQuantity] = useState<string>("0.1");
  
  // Scenario A (Manual/Locked)
  const [buyPriceA, setBuyPriceA] = useState<string>("69000");
  const [useManualUsdtA, setUseManualUsdtA] = useState<boolean>(false);
  const [manualUsdtA, setManualUsdtA] = useState<string>("7000");

  // Trade History Hook
  const { history, saveCalculation, deleteCalculation, exportToExcel, exportToJSON } = useTradeHistory();

  // Asset Summary Hook
  const { assets, loading: isAssetsLoading } = useAssets();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, [supabase]);

  // --- Calculations ---
  
  // Shared Sell Logic
  const sellStats = useMemo(() => {
    const sPrice = parseFloat(sellPrice);
    const qty = parseFloat(quantity);
    const fRate = (parseFloat(feeRate) || 0) / 100;

    if (isNaN(sPrice) || isNaN(qty)) {
      return { gross: 0, fee: 0, net: 0 };
    }

    const gross = sPrice * qty;
    const fee = gross * fRate;
    const net = gross - fee;

    return { gross, fee, net };
  }, [sellPrice, quantity, feeRate]);

  // Scenario A Result
  const scenarioAResult = useMemo(() => {
    const bPrice = parseFloat(buyPriceA);
    const fRate = (parseFloat(feeRate) || 0) / 100;
    if (isNaN(bPrice)) return null;

    return calculateAccumulation({
      buyPrice: bPrice,
      sellPrice: parseFloat(sellPrice),
      quantity: parseFloat(quantity),
      buyFeeRate: fRate,
      sellFeeRate: fRate,
    });
  }, [buyPriceA, sellPrice, quantity, feeRate]);

  // Scenario B Result (Live)
  const scenarioBResult = useMemo(() => {
    if (!livePrice) return null;
    const fRate = (parseFloat(feeRate) || 0) / 100;

    return calculateAccumulation({
      buyPrice: livePrice,
      sellPrice: parseFloat(sellPrice),
      quantity: parseFloat(quantity),
      buyFeeRate: fRate,
      sellFeeRate: fRate,
    });
  }, [livePrice, sellPrice, quantity, feeRate]);

  // Break-even for Scenario B
  const breakEvenB = useMemo(() => {
    const fRate = (parseFloat(feeRate) || 0) / 100;
    const qty = parseFloat(quantity);
    const netSell = sellStats.net;
    if (isNaN(qty) || isNaN(netSell)) return 0;
    
    return (netSell * (1 - fRate)) / qty;
  }, [sellStats.net, quantity, feeRate]);

  const handleSave = async (type: "break_even" | "profit", customData?: any) => {
    if (!user) {
      alert("请先登录以保存记录");
      return;
    }

    const res = await saveCalculation({
      buy_price: customData?.buyPrice ?? 0,
      sell_price: parseFloat(sellPrice),
      quantity: parseFloat(quantity),
      profit: customData?.profit ?? 0,
      fees: customData?.fees ?? 0,
      type,
    });

    if (res.error) alert(res.error);
    else alert("已保存至历史账本");
  };

  const handleSymbolChange = (val: string) => {
    const newSymbol = val.toUpperCase().trim();
    if (newSymbol && newSymbol !== symbol) {
      setSymbol(newSymbol);
    }
  };

  return (
    <main className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              TradeLens
            </h1>
            <p className="text-muted-foreground text-sm font-medium">专业波段双场景回购对比计算器</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-1 py-1 rounded-full border bg-background shadow-sm pr-3">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[120px] h-7 justify-between text-[10px] font-black uppercase hover:bg-transparent px-3"
                  >
                    {symbol || "选择交易对..."}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden" align="end">
                  <Command className="bg-background/95 backdrop-blur-md">
                    <CommandInput 
                      placeholder="搜索交易对..." 
                      className="h-9 text-xs" 
                      value={symbolInput}
                      onValueChange={setSymbolInput}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && symbolInput) {
                          handleSymbolChange(symbolInput);
                          setOpen(false);
                          setSymbolInput("");
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty className="py-6 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">未找到预设资产</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-[9px] font-bold uppercase tracking-widest"
                          onClick={() => {
                            handleSymbolChange(symbolInput);
                            setOpen(false);
                            setSymbolInput("");
                          }}
                        >
                          强制使用 "{symbolInput.toUpperCase()}"
                        </Button>
                      </CommandEmpty>
                      <CommandGroup heading="热门资产">
                        {popularSymbols.map((s) => (
                          <CommandItem
                            key={s.value}
                            value={s.value}
                            onSelect={(currentValue) => {
                              handleSymbolChange(currentValue);
                              setOpen(false);
                              setSymbolInput("");
                            }}
                            className="text-[11px] font-bold py-2 px-3"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5 text-primary",
                                symbol === s.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {s.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className={`flex items-center gap-2 pl-2 border-l ${isConnected ? "border-green-500/20" : "border-red-500/20"}`}>
                <Radio className={`w-3.5 h-3.5 ${isConnected ? "text-green-500 animate-pulse" : "text-red-500"}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  ${livePrice?.toLocaleString() || "---"}
                </span>
              </div>
            </div>
            {cnyRate && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-background shadow-sm">
                <Coins className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  USD/CNY: {cnyRate.toFixed(4)}
                </span>
              </div>
            )}
            <AuthComponent />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Panel: Parameters */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-lg border-primary/5">
              <CardHeader className="pb-4 text-primary">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                    卖出参数 (本金)
                  </CardTitle>
                  <span className="text-[10px] font-bold py-0.5 px-2 bg-primary/10 text-primary rounded-md">SELL INFO</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">卖出价格 ({quoteAsset})</Label>
                  <Input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="font-mono h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">卖出数量 ({baseAsset})</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="font-mono h-9" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">手续费率 (%)</Label>
                    <Input type="number" value={feeRate} onChange={(e) => setFeeRate(e.target.value)} className="font-mono text-center h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">实收 {quoteAsset} (含费)</Label>
                    <div className="h-9 flex items-center px-3 border rounded-md bg-muted/30 font-mono text-xs font-bold text-muted-foreground">
                      {sellStats.net.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-green-500/10">
              <CardHeader className="pb-4 border-l-4 border-green-500 rounded-t-sm">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Save className="w-4 h-4 text-green-500" />
                  成交记录 (Scenario A)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">买入价格 (已成交)</Label>
                  <Input type="number" value={buyPriceA} onChange={(e) => setBuyPriceA(e.target.value)} className="font-mono border-green-500/20 h-9" />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox 
                    id="useManual" 
                    checked={useManualUsdtA} 
                    onCheckedChange={(checked) => setUseManualUsdtA(checked as boolean)} 
                  />
                  <Label htmlFor="useManual" className="text-xs font-bold text-muted-foreground cursor-pointer">使用手动买入额</Label>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">买入总花费 ({quoteAsset})</Label>
                  <Input 
                    type="number" 
                    value={useManualUsdtA ? manualUsdtA : sellStats.net.toFixed(2)} 
                    onChange={(e) => setManualUsdtA(e.target.value)} 
                    disabled={!useManualUsdtA}
                    className={`font-mono h-9 ${!useManualUsdtA ? "bg-muted/50" : "border-green-500/20"}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Scenarios Comparison */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {/* Scenario A Card */}
              <Card className="shadow-xl bg-card border-t-4 border-green-500 h-full flex flex-col">
                <CardHeader className="pb-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                        Scenario A
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-100 text-green-600 rounded">成交统计</span>
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-bold">HISTORICAL PERFORMANCE</p>
                    </div>
                    <ArrowRightLeft className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter text-slate-400">最终获得币量</p>
                    <div className="text-3xl font-mono font-black text-foreground">
                      {scenarioAResult?.netBaseReceived.toFixed(8) || "0.00000000"} <span className="text-sm font-bold opacity-40">{baseAsset}</span>
                    </div>
                    <p className={`text-[11px] font-bold flex items-center gap-1 ${ (scenarioAResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {(scenarioAResult?.baseGain ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {(scenarioAResult?.baseGain ?? 0) >= 0 ? "+" : ""}
                      {scenarioAResult?.baseGain.toFixed(8)} {baseAsset}
                    </p>
                  </div>

                  <div className="py-4 border-y border-dashed border-slate-100">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase mb-2">
                      <span>手续费明细</span>
                      <span className="text-primary tracking-tighter">Total Fee ≈ ¥{( (scenarioAResult?.totalFeesQuote || 0) * (cnyRate || 7.23) ).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-muted/30 p-2 rounded-md">
                        <Label className="text-[8px] uppercase block mb-1 opacity-60">SELL ({quoteAsset})</Label>
                        {scenarioAResult?.sellFeeQuote.toFixed(2)}
                      </div>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <Label className="text-[8px] uppercase block mb-1 opacity-60">BUY ({baseAsset})</Label>
                        {scenarioAResult?.buyFeeBase.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter text-slate-400">回购收益估算 (折合)</p>
                    <div className={`text-4xl font-mono font-black ${ (scenarioAResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      $ {Math.abs( (scenarioAResult?.baseGain ?? 0) * parseFloat(buyPriceA) ).toFixed(2)}
                    </div>
                    <p className="text-sm font-bold text-muted-foreground opacity-60">
                      ≈ ¥ { ( (scenarioAResult?.baseGain ?? 0) * parseFloat(buyPriceA) * (cnyRate || 7.23) ).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase tracking-widest gap-2 bg-green-50/50" onClick={() => handleSave("profit", { profit: (scenarioAResult?.baseGain ?? 0) * parseFloat(buyPriceA), fees: scenarioAResult?.totalFeesQuote, buyPrice: parseFloat(buyPriceA) })}>
                    <Save className="w-3 h-3" /> 保存此成交记录
                  </Button>
                </CardFooter>
              </Card>

              {/* Scenario B Card */}
              <Card className="shadow-2xl bg-neutral-950 text-white border-t-4 border-blue-500 h-full flex flex-col">
                <CardHeader className="pb-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-blue-400">
                        Scenario B
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">实时买入</span>
                      </h3>
                      <p className="text-[10px] text-neutral-500 font-bold">REAL-TIME PREDICTION</p>
                    </div>
                    <Radio className={`w-4 h-4 ${isConnected ? "text-blue-500 animate-pulse" : "text-neutral-700"}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter text-neutral-400">预测获得币量</p>
                    <div className="text-3xl font-mono font-black text-blue-400">
                      {scenarioBResult?.netBaseReceived.toFixed(8) || "0.00000000"} <span className="text-sm font-bold opacity-40 text-blue-400/50">{baseAsset}</span>
                    </div>
                    <p className={`text-[11px] font-bold flex items-center gap-1 ${ (scenarioBResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {(scenarioBResult?.baseGain ?? 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {(scenarioBResult?.baseGain ?? 0) >= 0 ? "+" : ""}
                      {scenarioBResult?.baseGain.toFixed(8)} {baseAsset}
                    </p>
                  </div>

                  <div className="py-4 border-y border-neutral-800">
                    <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase mb-2">
                      <span>预估手续费</span>
                      <span className="text-orange-400 tracking-tighter text-[9px]">Total ≈ ¥{( (scenarioBResult?.totalFeesQuote || 0) * (cnyRate || 7.23) ).toFixed(2)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-neutral-900 p-2 rounded-md border border-neutral-800">
                        <Label className="text-[8px] text-neutral-600 block mb-1 uppercase">SELL ({quoteAsset})</Label>
                        {scenarioBResult?.sellFeeQuote.toFixed(2)}
                      </div>
                      <div className="bg-neutral-900 p-2 rounded-md border border-neutral-800">
                        <Label className="text-[8px] text-neutral-600 block mb-1 uppercase">BUY ({baseAsset})</Label>
                        {scenarioBResult?.buyFeeBase.toFixed(6)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-tighter text-neutral-400">即时盈亏估算</p>
                    <div className={`text-4xl font-mono font-black ${ (scenarioBResult?.baseGain ?? 0) >= 0 ? "text-blue-400" : "text-red-500"}`}>
                      $ {Math.abs( (scenarioBResult?.baseGain ?? 0) * (livePrice || 0) ).toFixed(2)}
                    </div>
                    <p className="text-sm font-bold text-neutral-600">
                      ≈ ¥ { ( (scenarioBResult?.baseGain ?? 0) * (livePrice || 0) * (cnyRate || 7.23) ).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-neutral-800">
                  <div className="w-full flex justify-between items-center text-[10px] font-bold">
                    <span className="text-neutral-500 uppercase">保本回购价:</span>
                    <span className="text-red-400 font-black font-mono tracking-tighter text-xs">
                      ${breakEvenB.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>

        {/* Secondary Section: History & Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="history" className="text-xs font-bold uppercase tracking-widest rounded-lg">历史账本</TabsTrigger>
              <TabsTrigger value="assets" className="text-xs font-bold uppercase tracking-widest rounded-lg">持仓概览</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs font-bold uppercase tracking-widest gap-2 rounded-lg">
                <Activity className="w-3.5 h-3.5" />
                智能分析
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-primary" />
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Recent Calculations</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={exportToExcel} className="h-6 px-2 text-[9px] font-bold uppercase">Excel</Button>
                      <Button variant="ghost" size="sm" onClick={exportToJSON} className="h-6 px-2 text-[9px] font-bold uppercase">JSON</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-3">
                  {history.length > 0 ? (
                    history.map((item, idx) => (
                      <div key={idx} className="group relative flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-background transition-all shadow-sm">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-sm font-black tracking-tighter">
                            {(item.buy_price || 0).toLocaleString()} <span className="text-muted-foreground/30 mx-1">→</span> {(item.sell_price || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">
                            {new Date(item.created_at!).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className={`font-mono text-sm font-black ${ (item.profit || 0) >= 0 ? "text-green-500" : "text-muted-foreground"}`}>
                              {(item.profit || 0).toFixed(2)} <span className="text-[10px] opacity-40">USDT</span>
                            </p>
                          </div>
                          {user && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                              onClick={() => { if(confirm("确定删除？")) deleteCalculation(item.id!) }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                      No Records Found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="mt-0">
               <Card className="border-none shadow-none bg-transparent">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {isAssetsLoading ? (
                      <div className="col-span-full py-12 text-center text-xs text-muted-foreground font-black uppercase">Loading Portfolio...</div>
                    ) : assets.length > 0 ? (
                      assets.map((asset) => (
                        <div key={asset.base_asset} className="bg-background border border-muted p-4 rounded-2xl shadow-sm hover:border-primary/20 transition-colors">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest">{asset.base_asset}</p>
                          <p className="text-xl font-mono font-black mt-1 leading-none">
                            {asset.total_quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                          </p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-muted/50">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Avg Price</span>
                            <span className="text-[10px] font-mono font-bold">${asset.average_price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-12 text-center text-xs text-muted-foreground border-2 border-dashed rounded-3xl font-black uppercase tracking-widest">
                        Portfolio Empty
                      </div>
                    )}
                  </div>
               </Card>
            </TabsContent>
          </Tabs>

          <footer className="lg:col-span-2 text-center py-12 text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-40 border-t border-muted mt-8">
            TradeLens Dashboard v0.2 Professional - Powered by Antigravity
          </footer>
        </div>
      </div>
    </main>
  );
}
