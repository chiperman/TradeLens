"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useApiKeys } from "@/hooks/use-api-keys";
import { EXCHANGE_LABELS, EXCHANGE_NAMES } from "@/lib/exchange/types";
import type { ExchangeName } from "@/lib/exchange/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Plug, CheckCircle, XCircle, Loader2 } from "lucide-react";

const NEEDS_PASSPHRASE: ExchangeName[] = ["bitget", "okx"];

export default function ApiKeysPage() {
  const t = useTranslations("settings");
  const { keys, loading, saveKey, deleteKey, testConnection } = useApiKeys();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeName>("binance");
  const [form, setForm] = useState({ apiKey: "", apiSecret: "", passphrase: "", label: "Default" });
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({});

  const handleOpenDialog = (exchange: ExchangeName) => {
    setSelectedExchange(exchange);
    setForm({ apiKey: "", apiSecret: "", passphrase: "", label: "Default" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveKey(
        selectedExchange,
        form.apiKey,
        form.apiSecret,
        form.label,
        form.passphrase || undefined
      );
      setDialogOpen(false);
    } catch (err) {
      console.error("保存失败:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult((prev) => ({ ...prev, [id]: null }));
    try {
      const connected = await testConnection(id);
      setTestResult((prev) => ({ ...prev, [id]: connected }));
    } catch {
      setTestResult((prev) => ({ ...prev, [id]: false }));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteKey(id);
      setTestResult((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("删除失败:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("apiKeys")}</h1>
        <p className="text-muted-foreground">{t("apiKeysDescription")}</p>
      </div>

      {/* 交易所卡片列表 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {EXCHANGE_NAMES.filter((e) => e !== "longbridge").map((exchange) => {
          const exchangeKeys = keys.filter((k) => k.exchange === exchange);

          return (
            <Card key={exchange}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">{EXCHANGE_LABELS[exchange]}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(exchange)}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("addKey")}
                </Button>
              </CardHeader>
              <CardContent>
                {exchangeKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noKeysConfigured")}</p>
                ) : (
                  <div className="space-y-3">
                    {exchangeKeys.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{key.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {key.last_sync_at
                              ? `${t("lastSync")}: ${new Date(key.last_sync_at).toLocaleString()}`
                              : t("neverSynced")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* 测试连接状态 */}
                          {testResult[key.id] === true && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {testResult[key.id] === false && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={testingId === key.id}
                            onClick={() => handleTest(key.id)}
                          >
                            {testingId === key.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plug className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Longbridge 占位 */}
      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{EXCHANGE_LABELS.longbridge}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("longbridgeComingSoon")}</p>
        </CardContent>
      </Card>

      {/* 添加 API Key 对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("addKeyFor")} {EXCHANGE_LABELS[selectedExchange]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("label")}</label>
              <Input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Default"
              />
            </div>
            <div>
              <label className="text-sm font-medium">API Key</label>
              <Input
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                placeholder="请输入 API Key"
                type="password"
              />
            </div>
            <div>
              <label className="text-sm font-medium">API Secret</label>
              <Input
                value={form.apiSecret}
                onChange={(e) => setForm((f) => ({ ...f, apiSecret: e.target.value }))}
                placeholder="请输入 API Secret"
                type="password"
              />
            </div>
            {NEEDS_PASSPHRASE.includes(selectedExchange) && (
              <div>
                <label className="text-sm font-medium">Passphrase</label>
                <Input
                  value={form.passphrase}
                  onChange={(e) => setForm((f) => ({ ...f, passphrase: e.target.value }))}
                  placeholder="请输入 Passphrase"
                  type="password"
                />
              </div>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !form.apiKey || !form.apiSecret}
              className="w-full"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
