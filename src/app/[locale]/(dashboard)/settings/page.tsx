"use client";

import { useTranslations } from "next-intl";
import { BarkSettings } from "@/components/bark-settings";
import { NotificationHistory } from "@/components/notification-history";
import { SyncHistoryList } from "@/components/sync-history-list";

export default function SettingsPage() {
  const tNav = useTranslations("Nav");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tNav("settings")}</h1>
      </div>

      <BarkSettings />
      <SyncHistoryList />
      <NotificationHistory />
    </div>
  );
}
