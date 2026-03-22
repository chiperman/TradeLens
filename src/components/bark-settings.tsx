"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useNotificationConfig } from "@/hooks/use-notification-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, BellRing, Link2, Send } from "lucide-react";

export function BarkSettings() {
  const t = useTranslations("Notifications");
  const { config, loading, updateConfig, testBarkNotification } = useNotificationConfig();

  const [serverUrl, setServerUrl] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [threshold, setThreshold] = useState("5.0");

  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (config) {
      setServerUrl(config.bark_server_url);
      setDeviceKey(config.bark_device_key || "");
      setIsEnabled(config.is_enabled);
      setThreshold(config.alert_threshold_percent.toString());
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateConfig({
        bark_server_url: serverUrl,
        bark_device_key: deviceKey,
        is_enabled: isEnabled,
        alert_threshold_percent: parseFloat(threshold) || 5.0,
      });
      alert(t("saveSuccess"));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await testBarkNotification();
      alert(t("testSuccess"));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("testFailed"));
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {t("loading", { fallback: "Loading..." })}
      </div>
    );
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-2xl border border-blue-100">
            <BellRing className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-slate-900">{t("enablePush")}</Label>
              <p className="text-xs text-slate-500">
                开启后，当资产剧烈波动时会通过 Bark 发送通知。
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("serverUrl")}
              </Label>
              <div className="relative flex items-center">
                <Link2 className="absolute left-3 w-4 h-4 text-slate-400" />
                <Input
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="pl-9 h-11"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("deviceKey")}
              </Label>
              <div className="relative flex items-center">
                <Bell className="absolute left-3 w-4 h-4 text-slate-400" />
                <Input
                  value={deviceKey}
                  onChange={(e) => setDeviceKey(e.target.value)}
                  placeholder={t("deviceKeyPlaceholder")}
                  className="pl-9 h-11"
                  type="password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t("threshold")}
                </Label>
                <span className="text-xs text-slate-400">{t("thresholdDesc")}</span>
              </div>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTest}
              disabled={testing || !deviceKey}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              {testing ? "..." : t("testPush")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "..." : t("save")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
