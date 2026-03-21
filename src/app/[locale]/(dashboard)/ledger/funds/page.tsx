"use client";

import { redirect } from "next/navigation";

/**
 * 资金流水子路由 — 重定向到 Ledger 页并激活 Fund Flows Tab
 */
export default function FundsPage() {
  redirect("../ledger");
}
