"use client";

import { useTranslations } from "next-intl";
import { Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function PortfolioPage() {
  const t = useTranslations("Common");
  const tNav = useTranslations("Nav");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {tNav("portfolio")}
        </h1>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold">{t("comingSoon")}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("comingSoonDesc")}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
