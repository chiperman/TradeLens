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
import * as ExcelJS from "exceljs";

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
          .map((cell) => (typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell))
          .join(",")
      )
      .join("\n");

    downloadFile(csv, "tradelens-transactions.csv", "text/csv");
  };

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();

    // Transactions Sheet
    const txSheet = workbook.addWorksheet("Transactions");
    txSheet.columns = [
      { header: "Date", key: "date", width: 25 },
      { header: "Symbol", key: "symbol", width: 15 },
      { header: "Asset Name", key: "asset_name", width: 20 },
      { header: "Asset Class", key: "asset_class", width: 15 },
      { header: "Side", key: "side", width: 10 },
      { header: "Price", key: "price", width: 15 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Commission", key: "commission", width: 15 },
      { header: "Exchange", key: "exchange", width: 15 },
      { header: "Source", key: "source", width: 15 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    transactions.forEach((tx) => {
      txSheet.addRow({
        date: new Date(tx.transacted_at).toISOString(),
        symbol: tx.symbol,
        asset_name: tx.asset_name ?? "",
        asset_class: tx.asset_class,
        side: tx.side,
        price: tx.price,
        quantity: tx.quantity,
        total: tx.quote_quantity,
        commission: tx.commission,
        exchange: tx.exchange,
        source: tx.source,
        notes: tx.notes ?? "",
      });
    });

    // Fund Flows Sheet
    const ffSheet = workbook.addWorksheet("Fund Flows");
    ffSheet.columns = [
      { header: "Date", key: "date", width: 25 },
      { header: "Direction", key: "direction", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Currency", key: "currency", width: 15 },
      { header: "Exchange", key: "exchange", width: 15 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    fundFlows.forEach((ff) => {
      ffSheet.addRow({
        date: new Date(ff.transacted_at).toISOString(),
        direction: ff.direction,
        amount: ff.amount,
        currency: ff.currency,
        exchange: ff.exchange,
        notes: ff.notes ?? "",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tradelens-export.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = { transactions, fundFlows, exportedAt: new Date().toISOString() };
    downloadFile(JSON.stringify(data, null, 2), "tradelens-backup.json", "application/json");
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
