"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as ExcelJS from "exceljs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { type TransactionFormData, ASSET_CLASSES } from "@/types/transaction";

interface DataImportProps {
  onImport: (data: TransactionFormData[]) => Promise<void>;
}

export function DataImport({ onImport }: DataImportProps) {
  const t = useTranslations("Ledger");
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const workbook = new ExcelJS.Workbook();
      let rows: Record<string, string | number | null | undefined>[] = [];

      if (file.name.endsWith(".csv")) {
        // Simple CSV parsing for now since ExcelJS CSV support can be tricky in browser
        const text = await file.text();
        const csvRows = text
          .split("\n")
          .map((r) => r.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
        const headers = csvRows[0].map((h) => h.toLowerCase());

        rows = csvRows
          .slice(1)
          .filter((r) => r.length >= headers.length)
          .map((row) => {
            const obj: Record<string, string> = {};
            headers.forEach((h, i) => {
              obj[h] = row[i];
            });
            return obj;
          });
      } else {
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];
        const headers: string[] = [];

        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber] = cell.text.toLowerCase();
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const obj: Record<string, string | number | null | undefined> = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber];
            if (header) {
              obj[header] = cell.value as string | number | null | undefined;
            }
          });
          rows.push(obj);
        });
      }

      // 映射到 TransactionFormData
      const transactions: TransactionFormData[] = rows.map((row, index) => {
        // 尝试匹配字段
        const symbol = String(row.symbol || row.ticker || "").toUpperCase();
        const assetClassRaw = row.asset_class || row.type || "crypto";
        const assetClass = String(assetClassRaw).toLowerCase();
        const side =
          String(row.side || row.type || "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY";
        const price = Number(row.price || 0);
        const quantity = Number(row.quantity || row.qty || row.amount || 0);
        const commission = Number(row.commission || row.fee || 0);
        const transacted_at = row.date || row.time || new Date().toISOString();

        if (!symbol) throw new Error(`Row ${index + 2}: Missing symbol`);

        const asset_name = row.asset_name || row.name;

        return {
          symbol,
          asset_name: asset_name ? String(asset_name) : undefined,
          asset_class: ASSET_CLASSES.includes(assetClass as (typeof ASSET_CLASSES)[number])
            ? (assetClass as (typeof ASSET_CLASSES)[number])
            : "crypto",
          exchange: String(row.exchange || "manual"),
          side: side as "BUY" | "SELL",
          price,
          quantity,
          commission,
          transacted_at: new Date(transacted_at).toISOString(),
          notes: row.notes ? String(row.notes) : undefined,
        };
      });

      if (transactions.length === 0) throw new Error("No valid transactions found");

      await onImport(transactions);
      setSuccess(t("importSuccess", { count: transactions.length }));
      setTimeout(() => setOpen(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="w-4 h-4 mr-1.5" />
          {t("import")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("importData")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-colors hover:border-primary/50 bg-muted/30">
            <Upload className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">{t("dropFile")}</p>
            <p className="text-xs text-muted-foreground mb-4">CSV or XLSX (Excel)</p>

            <input
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              id="file-upload"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <Button asChild disabled={uploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("uploading")}
                  </>
                ) : (
                  t("selectFile")
                )}
              </label>
            </Button>
          </div>

          {(error || success) && (
            <div
              className={`rounded-lg p-3 flex items-start gap-3 text-sm ${
                error
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
              }`}
            >
              {error ? (
                <AlertCircle className="w-4 h-4 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{error ? t("error") : t("success")}</p>
                <p className="opacity-90">{error || success}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">{t("tips")}</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
              <li>{t("tipHeader")}</li>
              <li>{t("tipRequired")} (Symbol, Price, Quantity)</li>
              <li>{t("tipDateFormat")}: YYYY-MM-DD HH:MM</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
