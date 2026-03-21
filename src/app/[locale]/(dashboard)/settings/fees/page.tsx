"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type FeeConfig, type FeeModel } from "@/types/transaction";
import { Loader2, Save, RotateCcw, Building2 } from "lucide-react";

const BROKER_TEMPLATES: Record<string, { name: string; config: FeeConfig }> = {
  longbridge: {
    name: "Longbridge (长桥)",
    config: {
      us_stock: { type: "per_share", rate: 0.0049, min: 0.99, currency: "USD" },
      hk_stock: { type: "percentage", rate: 0.0003, min: 15.0, currency: "HKD" },
      crypto: { type: "percentage", rate: 0.001, currency: "USDT" },
    },
  },
  futubull: {
    name: "Futu (富途)",
    config: {
      us_stock: { type: "per_share", rate: 0.0049, min: 0.99, currency: "USD" },
      hk_stock: { type: "percentage", rate: 0.0003, min: 15.0, currency: "HKD" },
      crypto: { type: "percentage", rate: 0.001, currency: "USDT" },
    },
  },
  binance: {
    name: "Binance (币安)",
    config: {
      us_stock: { type: "per_share", rate: 0.005, min: 1.0, currency: "USD" },
      hk_stock: { type: "percentage", rate: 0.0003, min: 15.0, currency: "HKD" },
      crypto: { type: "percentage", rate: 0.001, currency: "USDT" },
    },
  },
};

export default function FeeSettingsPage() {
  const t = useTranslations("Settings");
  const tLedger = useTranslations("Ledger");
  const { settings, loading, updateSettings } = useSettings();
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFeeConfig(settings.fee_config);
    }
  }, [settings]);

  const handleUpdateFee = (
    assetClass: keyof FeeConfig,
    field: keyof FeeModel,
    value: string | number
  ) => {
    if (!feeConfig) return;
    setFeeConfig({
      ...feeConfig,
      [assetClass]: {
        ...feeConfig[assetClass],
        [field]: value,
      },
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = BROKER_TEMPLATES[templateId];
    if (template) {
      setFeeConfig(template.config);
    }
  };

  const handleSave = async () => {
    if (!feeConfig) return;
    setSaving(true);
    try {
      await updateSettings({ fee_config: feeConfig });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !feeConfig) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("feeSettings")}</h1>
        <p className="text-sm text-muted-foreground">{t("feeSettingsDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* US Stock */}
          <FeeAssetCard
            title={tLedger("us_stock")}
            config={feeConfig.us_stock}
            onChange={(field, value) => handleUpdateFee("us_stock", field, value)}
          />

          {/* HK Stock */}
          <FeeAssetCard
            title={tLedger("hk_stock")}
            config={feeConfig.hk_stock}
            onChange={(field, value) => handleUpdateFee("hk_stock", field, value)}
          />

          {/* Crypto */}
          <FeeAssetCard
            title={tLedger("crypto")}
            config={feeConfig.crypto}
            onChange={(field, value) => handleUpdateFee("crypto", field, value)}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setFeeConfig(settings?.fee_config || null)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              {tLedger("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {tLedger("saveChanges")}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {t("brokerTemplates")}
              </CardTitle>
              <CardDescription className="text-xs">{t("brokerTemplatesDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(BROKER_TEMPLATES).map(([id, template]) => (
                <Button
                  key={id}
                  variant="outline"
                  className="w-full justify-start text-sm"
                  onClick={() => handleApplyTemplate(id)}
                >
                  {template.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeeAssetCard({
  title,
  config,
  onChange,
}: {
  title: string;
  config: FeeModel;
  onChange: (field: keyof FeeModel, value: string | number) => void;
}) {
  const t = useTranslations("Settings");
  const tLedger = useTranslations("Ledger");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("feeType")}</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={config.type}
              onChange={(e) => onChange("type", e.target.value)}
            >
              <option value="percentage">{t("percentage")}</option>
              <option value="per_share">{t("perShare")}</option>
              <option value="fixed">{t("fixed")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("feeRate")}</Label>
            <Input
              type="number"
              step="any"
              value={config.rate}
              onChange={(e) => onChange("rate", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("minFee")}</Label>
            <Input
              type="number"
              step="any"
              value={config.min || 0}
              onChange={(e) => onChange("min", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{tLedger("currency")}</Label>
            <Input value={config.currency} onChange={(e) => onChange("currency", e.target.value)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
