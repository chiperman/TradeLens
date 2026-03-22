import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase-server";
import { SyncHistoryList, type SyncHistory } from "@/components/sync-history-list";

export default async function SyncHistoryPage({
  params: { locale: _locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations("Settings.SyncHistory");
  const supabase = await createClient();
 
  const { data: history } = await supabase
    .from("sync_history")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card/50 backdrop-blur-sm">
        <SyncHistoryList initialData={(history as any) || []} limit={50} />
      </div>
    </div>
  );
}
