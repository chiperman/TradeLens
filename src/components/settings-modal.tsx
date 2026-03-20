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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <DialogTitle>安全设置</DialogTitle>
          </div>
          <DialogDescription>
            管理您的交易所 API 密钥。所有密钥均使用 AES-256-GCM 算法在服务器端加密存储。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4" /> 已绑定密钥
              </h3>
              {!isAdding && (
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="h-8 gap-1 text-primary">
                  <Plus className="w-3.5 h-3.5" /> 绑定新密钥
                </Button>
              )}
            </div>

            {keys.length > 0 ? (
              <div className="grid gap-2">
                {keys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-[10px] font-bold text-yellow-600 border border-yellow-500/20">
                        BN
                      </div>
                      <div>
                        <p className="font-bold">{k.exchange.toUpperCase()}</p>
                        <p className="text-[10px] text-muted-foreground">{k.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-500/5 px-2 py-0.5 rounded-full border border-green-500/10">
                      <Lock className="w-3 h-3" /> Encrypted
                    </div>
                  </div>
                ))}
              </div>
            ) : !isAdding && (
              <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground text-xs">
                暂未绑定任何 API 密钥
              </div>
            )}
          </div>

          {isAdding && (
            <form onSubmit={handleSave} className="space-y-4 border-t pt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="apiKey" className="text-xs">API Key</Label>
                  <Input 
                    id="apiKey" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)} 
                    placeholder="请输入 Binance API Key"
                    className="h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apiSecret" className="text-xs">API Secret</Label>
                  <Input 
                    id="apiSecret" 
                    type="password"
                    value={apiSecret} 
                    onChange={(e) => setApiSecret(e.target.value)} 
                    placeholder="请输入 Binance API Secret"
                    className="h-9"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="label" className="text-xs">备注标签 (可选)</Label>
                  <Input 
                    id="label" 
                    value={label} 
                    onChange={(e) => setLabel(e.target.value)} 
                    placeholder="例如：主账户"
                    className="h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsAdding(false)}>取消</Button>
                <Button size="sm" type="submit" disabled={loading}>
                  {loading ? "保存中..." : "确认绑定"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
