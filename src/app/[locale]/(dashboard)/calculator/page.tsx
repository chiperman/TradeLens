"use client";

import { useState, useMemo, useEffect } from "react";
import {
  calculateAccumulation,
  calculateBreakEven,
  calculateNetProfit,
  calculateFeeAmount,
} from "@/lib/calculator";
import { type AssetClass, type FeeModel } from "@/types/transaction";
import { useSettings } from "@/hooks/use-settings";
import { useBinancePrice } from "@/hooks/use-binance-price";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useTradeHistory } from "@/hooks/use-trade-history";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { useAssets } from "@/hooks/use-assets";
import { sileo } from "sileo";
import { createClient } from "@/lib/supabase";
import { type User } from "@supabase/supabase-js";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  RefreshCw,
  Radio,
  Save,
  History,
  Coins,
  Activity,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Check,
  ChevronsUpDown,
  Layers,
} from "lucide-react";
import { AuthComponent } from "@/components/auth-component";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { OptionsCalculator } from "@/components/calculators/options/options-calculator";
import { ThemeToggle } from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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
  const tCommon = useTranslations("Common");
  const tCalc = useTranslations("Calculator");
  const tHistory = useTranslations("History");
  const tAssets = useTranslations("Assets");
  const tAuth = useTranslations("Auth");

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
  const { rate: cnyRate } = useExchangeRate();

  // Asset Class & Settings
  const [assetClass, setAssetClass] = useLocalStorage<AssetClass>(
    "tradelens_calculator_asset",
    "crypto"
  );
  const { settings } = useSettings();

  const activeFeeModel = useMemo<FeeModel>(() => {
    if (settings?.fee_config?.[assetClass]) return settings.fee_config[assetClass];
    return assetClass === "crypto"
      ? { type: "percentage", rate: 0.001, currency: "USDT" }
      : { type: "per_share", rate: 0.005, min: 1.0, currency: "USD" };
  }, [settings, assetClass]);

  // Core Input States
  const [sellPrice, setSellPrice] = useState<string>("70000");
  const [quantity, setQuantity] = useState<string>("0.1");

  // Scenario A (Manual/Locked)
  const [buyPriceA, setBuyPriceA] = useState<string>("69000");
  const [useManualUsdtA, setUseManualUsdtA] = useState<boolean>(false);
  const [manualUsdtA, setManualUsdtA] = useState<string>("7000");

  // Matrix Target Prices
  const [matrixTargetsStr, setMatrixTargetsStr] = useState<string>("70000, 75000, 80000");

  const matrixResults = useMemo(() => {
    const targets = matrixTargetsStr
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    const qty = parseFloat(quantity);
    const bPrice = parseFloat(buyPriceA);
    if (isNaN(qty) || isNaN(bPrice) || targets.length === 0) return [];

    return targets.map((tPrice) => {
      const { profit, fees } = calculateNetProfit(
        bPrice,
        tPrice,
        qty,
        activeFeeModel,
        activeFeeModel,
        assetClass
      );
      const buyGross = bPrice * qty;
      const roi = buyGross > 0 ? (profit / buyGross) * 100 : 0;
      return { tPrice, profit, fees, roi };
    });
  }, [matrixTargetsStr, buyPriceA, quantity, activeFeeModel, assetClass]);

  // Trade History Hook
  const { history, saveCalculation, deleteCalculation, exportToExcel, exportToJSON } =
    useTradeHistory();

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

    if (isNaN(sPrice) || isNaN(qty)) {
      return { gross: 0, fee: 0, net: 0 };
    }

    const gross = sPrice * qty;
    const fee = calculateFeeAmount(gross, qty, activeFeeModel);
    const net = gross - fee;

    return { gross, fee, net };
  }, [sellPrice, quantity, activeFeeModel]);

  // Scenario A Result
  const scenarioAResult = useMemo(() => {
    const bPrice = parseFloat(buyPriceA);
    if (isNaN(bPrice)) return null;

    return calculateAccumulation({
      buyPrice: bPrice,
      sellPrice: parseFloat(sellPrice),
      quantity: parseFloat(quantity),
      buyFeeModel: activeFeeModel,
      sellFeeModel: activeFeeModel,
      assetClass,
    });
  }, [buyPriceA, sellPrice, quantity, activeFeeModel, assetClass]);

  // Scenario B Result (Live)
  const scenarioBResult = useMemo(() => {
    if (!livePrice) return null;

    return calculateAccumulation({
      buyPrice: livePrice,
      sellPrice: parseFloat(sellPrice),
      quantity: parseFloat(quantity),
      buyFeeModel: activeFeeModel,
      sellFeeModel: activeFeeModel,
      assetClass,
    });
  }, [livePrice, sellPrice, quantity, activeFeeModel, assetClass]);

  // Break-even for Scenario B
  const breakEvenB = useMemo(() => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || !livePrice) return 0;

    return calculateBreakEven(livePrice, qty, activeFeeModel, activeFeeModel, assetClass);
  }, [livePrice, quantity, activeFeeModel, assetClass]);

  const handleSave = async (
    type: "break_even" | "profit",
    customData?: { buyPrice?: number; profit?: number; fees?: number }
  ) => {
    if (!user) {
      sileo.error({ title: tAuth("loginRequired") || "请先登录以保存记录" });
      return;
    }

    const data = {
      buy_price: customData?.buyPrice ?? 0,
      sell_price: parseFloat(sellPrice),
      quantity: parseFloat(quantity),
      profit: customData?.profit ?? 0,
      fees: customData?.fees ?? 0,
      type,
    };

    const res = await saveCalculation(data);
    if (res.error) {
      const errorMessage = typeof res.error === "string" ? res.error : res.error.message;
      sileo.error({ title: errorMessage });
    } else {
      sileo.success({ title: tCalc("saveSuccess") || "已保存至历史账本" });
    }
  };

  const handleSymbolChange = (val: string) => {
    const newSymbol = val.toUpperCase().trim();
    if (newSymbol && newSymbol !== symbol) {
      setSymbol(newSymbol);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white py-10 px-4">
      <div className="container mx-auto space-y-10 max-w-6xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
              TradeLens
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-8 h-[2px] bg-primary/30 rounded-full" />
              <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em]">
                {tCommon("subtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="flex items-center gap-2 px-1 py-1 rounded-full border bg-background shadow-sm pr-3">
              <Tabs
                value={assetClass}
                onValueChange={(val) => setAssetClass(val as AssetClass)}
                className="h-7 flex items-center bg-transparent border-none mx-1"
              >
                <TabsList className="h-6 bg-slate-100/50 dark:bg-slate-800 p-0.5 rounded-full">
                  <TabsTrigger value="crypto" className="text-[9px] h-5 rounded-full px-2">
                    Crypto
                  </TabsTrigger>
                  <TabsTrigger value="us_stock" className="text-[9px] h-5 rounded-full px-2">
                    US
                  </TabsTrigger>
                  <TabsTrigger value="hk_stock" className="text-[9px] h-5 rounded-full px-2">
                    HK
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[120px] h-7 justify-between text-[10px] font-black uppercase hover:bg-transparent px-3"
                  >
                    {symbol || tCalc("selectSymbol")}
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[200px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden"
                  align="end"
                >
                  <Command className="bg-background/95 backdrop-blur-md">
                    <CommandInput
                      placeholder={tCalc("searchSymbol")}
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
                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">
                          {tCalc("noSymbolsFound")}
                        </p>
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
                          {tCalc("forceUse")} &quot;{symbolInput.toUpperCase()}&quot;
                        </Button>
                      </CommandEmpty>
                      <CommandGroup heading={tCalc("popularAssets")}>
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
              <div
                className={`flex items-center gap-2 pl-2 border-l ${isConnected ? "border-green-500/20" : "border-red-500/20"}`}
              >
                <Radio
                  className={`w-3.5 h-3.5 ${isConnected ? "text-green-500 animate-pulse" : "text-red-500"}`}
                />
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
          <div className="lg:col-span-4 space-y-8">
            <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    {tCalc("sellParameters")}
                  </CardTitle>
                  <span className="text-[8px] font-black py-0.5 px-2 bg-slate-100 text-slate-500 rounded-full tracking-tighter">
                    SELL PARAMETERS
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="sellPrice"
                    className="text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    {tCalc("sellPrice")} ({quoteAsset})
                  </Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="font-mono h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="quantity"
                    className="text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    {tCalc("quantity")} ({baseAsset})
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="font-mono h-9"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {tCalc("feeRate")}
                    </Label>
                    <div className="flex items-center justify-center px-1 border rounded-md bg-muted/10 font-mono text-[9px] text-muted-foreground text-center h-9">
                      {activeFeeModel.type === "percentage"
                        ? `${(activeFeeModel.rate * 100).toFixed(3)}%`
                        : activeFeeModel.type === "per_share"
                          ? `${activeFeeModel.rate} ${activeFeeModel.currency}/sh (Min: ${activeFeeModel.min || 0})`
                          : `${activeFeeModel.rate} ${activeFeeModel.currency}`}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {tCalc("netReceived")} {quoteAsset}
                    </Label>
                    <div className="h-9 flex items-center px-3 border rounded-md bg-muted/30 font-mono text-xs font-bold text-muted-foreground">
                      {sellStats.net.toFixed(2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4 border-l-4 border-green-500 bg-green-50/30">
                <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-green-500" />
                  {tCalc("buyParameters")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="buyPriceA"
                    className="text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    {tCalc("buyPriceExecuted")}
                  </Label>
                  <Input
                    id="buyPriceA"
                    type="number"
                    value={buyPriceA}
                    onChange={(e) => setBuyPriceA(e.target.value)}
                    className="font-mono border-green-500/20 h-9"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <Checkbox
                    id="useManual"
                    checked={useManualUsdtA}
                    onCheckedChange={(checked) => setUseManualUsdtA(checked as boolean)}
                  />
                  <Label
                    htmlFor="useManual"
                    className="text-xs font-bold text-muted-foreground cursor-pointer"
                  >
                    {tCalc("useManualUsdt")}
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="manualUsdtA"
                    className="text-[10px] font-bold uppercase text-muted-foreground"
                  >
                    {tCalc("buyCost")} ({quoteAsset})
                  </Label>
                  <Input
                    id="manualUsdtA"
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
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Scenario A Card */}
              <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white h-full flex flex-col overflow-hidden">
                <div className="h-1.5 bg-green-500 w-full" />
                <CardHeader className="pb-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-slate-800">
                        {tCalc("labelA") || "Scenario A"}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100">
                          {tCalc("executionStats") || "成交统计"}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        {tCalc("historicalPerformance") || "Historical Performance"}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl">
                      <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                      {tCalc("netBaseReceived") || "最终获得币量"}
                    </p>
                    <div className="text-3xl font-mono font-black text-slate-900 tracking-tighter">
                      {scenarioAResult?.netBaseReceived.toFixed(8) || "0.00000000"}{" "}
                      <span className="text-sm font-bold opacity-30 text-slate-400">
                        {baseAsset}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-black flex items-center gap-1.5 ${(scenarioAResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {(scenarioAResult?.baseGain ?? 0) >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {(scenarioAResult?.baseGain ?? 0) >= 0 ? "+" : ""}
                      {scenarioAResult?.baseGain.toFixed(8)} {baseAsset}
                    </p>
                  </div>

                  <div className="py-5 border-y border-slate-50">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">
                      <span>手续费明细</span>
                      <span className="text-slate-900">
                        {tCalc("total") || "Total"} ≈ ¥
                        {((scenarioAResult?.totalFeesQuote || 0) * (cnyRate || 7.23)).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <Label className="text-[8px] font-black uppercase block mb-1.5 text-slate-400">
                          SELL ({quoteAsset})
                        </Label>
                        <span className="font-bold text-slate-700">
                          {scenarioAResult?.sellFeeQuote.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <Label className="text-[8px] font-black uppercase block mb-1.5 text-slate-400">
                          BUY ({baseAsset})
                        </Label>
                        <span className="font-bold text-slate-700">
                          {scenarioAResult?.buyFeeBase.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                      {tCalc("repurchaseProfitEst") || "回购收益估算 (折合)"}
                    </p>
                    <div
                      className={`text-4xl font-mono font-black tracking-tighter ${(scenarioAResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      ${" "}
                      {Math.abs((scenarioAResult?.baseGain ?? 0) * parseFloat(buyPriceA)).toFixed(
                        2
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                      ≈ ¥{" "}
                      {(
                        (scenarioAResult?.baseGain ?? 0) *
                        parseFloat(buyPriceA) *
                        (cnyRate || 7.23)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 px-6 pb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-[10px] font-black uppercase tracking-[0.2em] gap-2 h-10 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all"
                    onClick={() =>
                      handleSave("profit", {
                        profit: (scenarioAResult?.baseGain ?? 0) * parseFloat(buyPriceA),
                        fees: scenarioAResult?.totalFeesQuote,
                        buyPrice: parseFloat(buyPriceA),
                      })
                    }
                  >
                    <Save className="w-3.5 h-3.5" /> {tCalc("saveBtn")}
                  </Button>
                </CardFooter>
              </Card>

              {/* Scenario B Card */}
              <Card className="shadow-2xl shadow-blue-100/50 border-none bg-gradient-to-br from-blue-50/50 to-white h-full flex flex-col relative overflow-hidden group">
                <div className="h-1.5 bg-blue-500 w-full" />
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <Radio className="w-40 h-40 text-blue-600 rotate-12" />
                </div>
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2 text-blue-800">
                        {tCalc("labelB") || "Scenario B"}
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full border border-blue-100">
                          {tCalc("liveBuy") || "实时买入"}
                        </span>
                      </h3>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
                        {tCalc("realTimePrediction") || "Real-time Prediction"}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-xl border-none transition-all ${isConnected ? "bg-green-50" : "bg-slate-50"}`}
                    >
                      <Radio
                        className={`w-4 h-4 ${isConnected ? "text-green-500 animate-pulse" : "text-slate-300"}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                      {tCalc("predictedQuantity")}
                    </p>
                    <div className="text-3xl font-mono font-black text-slate-900 tracking-tighter">
                      {scenarioBResult?.netBaseReceived.toFixed(8) || "0.00000000"}{" "}
                      <span className="text-sm font-bold opacity-30 text-slate-400">
                        {baseAsset}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] font-black flex items-center gap-1.5 ${(scenarioBResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {(scenarioBResult?.baseGain ?? 0) >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {(scenarioBResult?.baseGain ?? 0) >= 0 ? "+" : ""}
                      {scenarioBResult?.baseGain.toFixed(8)} {baseAsset}
                    </p>
                  </div>

                  <div className="py-5 border-y border-blue-100/30">
                    <div className="flex justify-between text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">
                      <span>手续费明细 (实时)</span>
                      <span className="text-blue-600">
                        {tCalc("total") || "Total"} ≈ ¥
                        {((scenarioBResult?.totalFeesQuote || 0) * (cnyRate || 7.23)).toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                      <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                        <Label className="text-[8px] font-black uppercase block mb-1.5 text-blue-400">
                          SELL ({quoteAsset})
                        </Label>
                        <span className="font-bold text-blue-900">
                          {scenarioBResult?.sellFeeQuote.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-100/50">
                        <Label className="text-[8px] font-black uppercase block mb-1.5 text-blue-400">
                          BUY ({baseAsset})
                        </Label>
                        <span className="font-bold text-blue-900">
                          {scenarioBResult?.buyFeeBase.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                        {tCalc("liveProfitEst") || "当前市价收益 (折合)"}
                      </p>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">
                          Live Price
                        </p>
                        <p className="text-[10px] font-mono font-black text-blue-500 leading-none mt-1">
                          ${livePrice?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-4xl font-mono font-black tracking-tighter ${(scenarioBResult?.baseGain ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      $ {Math.abs((scenarioBResult?.baseGain ?? 0) * (livePrice || 0)).toFixed(2)}
                    </div>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">
                      ≈ ¥{" "}
                      {(
                        (scenarioBResult?.baseGain ?? 0) *
                        (livePrice || 0) *
                        (cnyRate || 7.23)
                      ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2 px-6 pb-6 relative z-10 flex flex-col gap-4">
                  <div className="w-full h-px bg-blue-100/50" />
                  <div className="w-full flex justify-between items-center text-[10px] font-black">
                    <span className="text-slate-400 uppercase tracking-widest">
                      {tCalc("breakEven")}:
                    </span>
                    <span className="text-red-500 font-mono tracking-tighter text-sm">
                      ${breakEvenB.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-[10px] font-black uppercase tracking-[0.2em] gap-2 h-10 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 text-blue-600 transition-all border border-blue-100"
                    onClick={() =>
                      handleSave("profit", {
                        profit: (scenarioBResult?.baseGain ?? 0) * (livePrice || 0),
                        fees: scenarioBResult?.totalFeesQuote,
                        buyPrice: livePrice ?? undefined,
                      })
                    }
                  >
                    <Save className="w-3.5 h-3.5" /> {tCalc("saveBtnLive") || "保存实时成交记录"}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Matrix Projection Card */}
            <Card className="shadow-2xl shadow-purple-100/50 border-none bg-gradient-to-br from-purple-50/30 to-white overflow-hidden">
              <div className="h-1.5 bg-purple-500 w-full" />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    {tCalc("matrixTitle") || "多价位 P&L 矩阵试算"}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">
                      {tCalc("targetPrices") || "目标卖出价 (逗号分隔)"}
                    </Label>
                    <Input
                      value={matrixTargetsStr}
                      onChange={(e) => setMatrixTargetsStr(e.target.value)}
                      placeholder="e.g. 70000, 75000, 80000"
                      className="font-mono text-xs h-8"
                    />
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-50 text-[9px] uppercase tracking-widest text-slate-400">
                        <tr>
                          <th className="px-4 py-2">Target Price ({quoteAsset})</th>
                          <th className="px-4 py-2">Net P&L ({quoteAsset})</th>
                          <th className="px-4 py-2">ROI</th>
                          <th className="px-4 py-2">Est. Fees</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {matrixResults.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-2 font-bold text-slate-700">
                              {r.tPrice.toLocaleString()}
                            </td>
                            <td
                              className={`px-4 py-2 font-bold ${r.profit >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {r.profit >= 0 ? "+" : ""}
                              {r.profit.toFixed(2)}
                            </td>
                            <td
                              className={`px-4 py-2 font-bold ${r.roi >= 0 ? "text-green-500" : "text-red-500"}`}
                            >
                              {r.roi >= 0 ? "+" : ""}
                              {r.roi.toFixed(2)}%
                            </td>
                            <td className="px-4 py-2 text-slate-400">{r.fees.toFixed(2)}</td>
                          </tr>
                        ))}
                        {matrixResults.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                              Please enter valid prices
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Secondary Section: History & Assets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-6">
          <Tabs defaultValue="history" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              <TabsTrigger
                value="history"
                className="text-xs font-bold uppercase tracking-widest rounded-lg"
              >
                {tHistory("title")}
              </TabsTrigger>
              <TabsTrigger
                value="assets"
                className="text-xs font-bold uppercase tracking-widest rounded-lg"
              >
                {tAssets("title")}
              </TabsTrigger>
              <TabsTrigger
                value="options"
                className="text-xs font-bold uppercase tracking-widest gap-2 rounded-lg"
              >
                <Layers className="w-3.5 h-3.5" />
                Options
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="text-xs font-bold uppercase tracking-widest gap-2 rounded-lg"
              >
                <Activity className="w-3.5 h-3.5" />
                {tCalc("smartAnalytics") || "智能分析"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="options" className="mt-0">
              <OptionsCalculator />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsDashboard />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                        <History className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Recent Calculations
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportToExcel}
                        className="h-6 px-2 text-[9px] font-bold uppercase"
                      >
                        Excel
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportToJSON}
                        className="h-6 px-2 text-[9px] font-bold uppercase"
                      >
                        JSON
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-0 space-y-3">
                  {history.length > 0 ? (
                    history.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-sm font-black tracking-tighter text-slate-700">
                            {(item.buy_price || 0).toLocaleString()}{" "}
                            <span className="text-slate-300 mx-2 font-light">→</span>{" "}
                            {(item.sell_price || 0).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="w-3 h-3 opacity-40" />
                            {new Date(item.created_at!).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p
                              className={`font-mono text-sm font-black ${(item.profit || 0) >= 0 ? "text-green-500" : "text-slate-400"}`}
                            >
                              {(item.profit || 0).toFixed(2)}{" "}
                              <span className="text-[10px] opacity-30">USDT</span>
                            </p>
                          </div>
                          {user && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                              onClick={() => {
                                if (confirm(tCommon("confirmDelete") || "确定删除？"))
                                  deleteCalculation(item.id!);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">
                      {tHistory("empty")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="mt-0">
              <Card className="border-none shadow-none bg-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isAssetsLoading ? (
                    <div className="col-span-full py-20 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                      <RefreshCw className="w-5 h-5 mx-auto mb-4 animate-spin opacity-20" />
                      {tCommon("loading") || "Loading Portfolio..."}
                    </div>
                  ) : assets.length > 0 ? (
                    assets.map((asset) => (
                      <div
                        key={asset.base_asset}
                        className="group relative bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:border-primary/20 transition-all duration-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 bg-primary/5 rounded-lg border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors">
                            <Coins className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full">
                            {asset.base_asset}
                          </span>
                        </div>
                        <p className="text-2xl font-mono font-black text-slate-900 leading-none tracking-tighter">
                          {asset.total_quantity.toLocaleString(undefined, {
                            maximumFractionDigits: 6,
                          })}
                        </p>
                        <div className="mt-5 pt-4 border-t border-slate-50 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {tAssets("avgCost") || "Avg Cost"}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-600">
                              $
                              {asset.average_price.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {tAssets("totalValue") || "Total Value"}
                            </span>
                            <span className="text-[10px] font-mono font-black text-blue-600">
                              $
                              {(asset.total_quantity * asset.average_price).toLocaleString(
                                undefined,
                                { minimumFractionDigits: 2 }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 leading-loose">
                        {tAssets("empty")}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <footer className="lg:col-span-2 text-center py-16 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] border-t border-slate-100 mt-12 bg-white/50 rounded-b-3xl">
            TradeLens Dashboard v0.2 &bull; {tCommon("subtitle")}
          </footer>
        </div>
      </div>
    </main>
  );
}
