"use client";

import { useState } from "react";
import { useApiKeys } from "@/hooks/use-api-keys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Key, Lock, Plus } from "lucide-react";
import { SensitiveInput } from "@/components/ui/sensitive-input";

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const { keys, saveKey, loading } = useApiKeys();
  const [exchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [label, setLabel] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveKey(exchange, apiKey, apiSecret, label);
      setApiKey("");
      setApiSecret("");
      setLabel("");
      setIsAdding(false);
      alert("API Key 已安全保存并加密");
    } catch (err) {
      alert(err instanceof Error ? err.message : "保存失败");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] p-8 bg-white/95 backdrop-blur-xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-2xl border border-green-100">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tighter text-slate-900">
              安全设置
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-medium text-slate-400">
            管理您的交易所 API 密钥。所有密钥均使用 AES-256-GCM 算法在服务器端加密存储。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 mt-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                <Key className="w-3.5 h-3.5" /> 已绑定密钥
              </h3>
              {!isAdding && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="h-8 gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest bg-blue-50/50 hover:bg-blue-50 rounded-xl px-3 transition-all"
                >
                  <Plus className="w-3 h-3" /> 绑定新密钥
                </Button>
              )}
            </div>

            {keys.length > 0 ? (
              <div className="grid gap-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/5 flex items-center justify-center text-xs font-black text-orange-600 border border-orange-500/10 group-hover:bg-orange-500 group-hover:text-white transition-all">
                        BN
                      </div>
                      <div>
                        <p className="font-black text-sm text-slate-900 tracking-tight">
                          {k.exchange.toUpperCase()}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {k.label || "Default Key"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                      <Lock className="w-2.5 h-2.5" /> Encrypted
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isAdding && (
                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                    暂未绑定任何 API 密钥
                  </p>
                </div>
              )
            )}
          </div>

          {isAdding && (
            <form
              onSubmit={handleSave}
              className="space-y-5 border-t border-slate-100 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="apiKey"
                    className="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    API Key
                  </Label>
                  <SensitiveInput
                    id="apiKey"
                    value={apiKey}
                    onValueChange={setApiKey}
                    placeholder="请输入 Binance API Key"
                    className="border-slate-200 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="apiSecret"
                    className="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    API Secret
                  </Label>
                  <SensitiveInput
                    id="apiSecret"
                    value={apiSecret}
                    onValueChange={setApiSecret}
                    placeholder="请输入 Binance API Secret"
                    className="border-slate-200 focus:ring-blue-500/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="label"
                    className="text-[10px] font-black uppercase text-slate-400 tracking-widest"
                  >
                    备注标签 (可选)
                  </Label>
                  <Input
                    id="label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="例如：交易主账户"
                    className="h-11 rounded-xl border-slate-200 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="h-10 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 rounded-xl"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  className="h-10 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200"
                  disabled={loading}
                >
                  {loading ? "正在保存..." : "确认绑定"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
