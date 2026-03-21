"use client";

import { useTranslations } from "next-intl";
import { type Transaction, type FundFlow } from "@/types/transaction";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";
import * as XLSX from "xlsx";

interface DataExportProps {
  transactions: Transaction[];
  fundFlows: FundFlow[];
}

export function DataExport({ transactions, fundFlows }: DataExportProps) {
  const t = useTranslations("Ledger");

  const exportCSV = () => {
    const headers = [
      "Date",
      "Symbol",
      "Asset Name",
      "Asset Class",
      "Side",
      "Price",
      "Quantity",
      "Total",
      "Commission",
      "Exchange",
      "Source",
      "Notes",
    ];
    const rows = transactions.map((tx) => [
      new Date(tx.transacted_at).toISOString(),
      tx.symbol,
      tx.asset_name ?? "",
      tx.asset_class,
      tx.side,
      tx.price,
      tx.quantity,
      tx.quote_quantity,
      tx.commission,
      tx.exchange,
      tx.source,
      tx.notes ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",")
              ? `"${cell}"`
              : cell
          )
          .join(",")
      )
      .join("\n");

    downloadFile(csv, "tradelens-transactions.csv", "text/csv");
  };

  const exportExcel = () => {
    const txData = transactions.map((tx) => ({
      Date: new Date(tx.transacted_at).toISOString(),
      Symbol: tx.symbol,
      "Asset Name": tx.asset_name ?? "",
      "Asset Class": tx.asset_class,
      Side: tx.side,
      Price: tx.price,
      Quantity: tx.quantity,
      Total: tx.quote_quantity,
      Commission: tx.commission,
      Exchange: tx.exchange,
      Source: tx.source,
      Notes: tx.notes ?? "",
    }));

    const ffData = fundFlows.map((ff) => ({
      Date: new Date(ff.transacted_at).toISOString(),
      Direction: ff.direction,
      Amount: ff.amount,
      Currency: ff.currency,
      Exchange: ff.exchange,
      Notes: ff.notes ?? "",
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(txData);
    const ws2 = XLSX.utils.json_to_sheet(ffData);
    XLSX.utils.book_append_sheet(wb, ws1, "Transactions");
    XLSX.utils.book_append_sheet(wb, ws2, "Fund Flows");
    XLSX.writeFile(wb, "tradelens-export.xlsx");
  };

  const exportJSON = () => {
    const data = { transactions, fundFlows, exportedAt: new Date().toISOString() };
    downloadFile(
      JSON.stringify(data, null, 2),
      "tradelens-backup.json",
      "application/json"
    );
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1.5" />
          {t("export")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <FileText className="w-4 h-4 mr-2" />
          {t("exportCSV")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          {t("exportExcel")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportJSON}>
          <FileJson className="w-4 h-4 mr-2" />
          {t("exportJSON")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
