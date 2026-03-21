"use client";

import { useTranslations } from "next-intl";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default function DashboardPage() {
  const t = useTranslations("Common");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AnalyticsDashboard />
    </div>
  );
}
