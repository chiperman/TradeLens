"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OptionsPayoffDiagram } from "./payoff-diagram";
import { Layers } from "lucide-react";

export function OptionsCalculator() {
  const [strike, setStrike] = useState<string>("150");
  const [premium, setPremium] = useState<string>("5.5");
  const [type, setType] = useState<"CALL" | "PUT">("CALL");
  const [contracts, setContracts] = useState<string>("1");
  const [multiplier, setMultiplier] = useState<string>("100");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Parameters */}
      <div className="lg:col-span-4 space-y-8">
        <Card className="shadow-2xl shadow-slate-200/50 border-none bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Options Parameters
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                Option Type
              </Label>
              <div className="flex items-center gap-4 h-9">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calc_option_type"
                    value="CALL"
                    checked={type === "CALL"}
                    onChange={() => setType("CALL")}
                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-xs text-emerald-600">CALL (看涨)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calc_option_type"
                    value="PUT"
                    checked={type === "PUT"}
                    onChange={() => setType("PUT")}
                    className="w-4 h-4 text-rose-600 bg-slate-100 border-slate-300 focus:ring-rose-500"
                  />
                  <span className="font-bold text-xs text-rose-600">PUT (看跌)</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="calc_strike"
                className="text-[10px] font-bold uppercase text-muted-foreground"
              >
                Strike Price
              </Label>
              <Input
                id="calc_strike"
                type="number"
                value={strike}
                onChange={(e) => setStrike(e.target.value)}
                className="font-mono h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="calc_premium"
                className="text-[10px] font-bold uppercase text-muted-foreground"
              >
                Premium
              </Label>
              <Input
                id="calc_premium"
                type="number"
                value={premium}
                onChange={(e) => setPremium(e.target.value)}
                className="font-mono h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="calc_contracts"
                  className="text-[10px] font-bold uppercase text-muted-foreground"
                >
                  Contracts
                </Label>
                <Input
                  id="calc_contracts"
                  type="number"
                  value={contracts}
                  onChange={(e) => setContracts(e.target.value)}
                  className="font-mono text-center h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="calc_multiplier"
                  className="text-[10px] font-bold uppercase text-muted-foreground"
                >
                  Multiplier
                </Label>
                <Input
                  id="calc_multiplier"
                  type="number"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="font-mono text-center h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payoff Diagram */}
      <div className="lg:col-span-8">
        <OptionsPayoffDiagram
          strike={parseFloat(strike) || 0}
          premium={parseFloat(premium) || 0}
          type={type}
          contracts={parseInt(contracts, 10) || 1}
          multiplier={parseInt(multiplier, 10) || 100}
        />
      </div>
    </div>
  );
}
