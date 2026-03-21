"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTransactions } from "@/hooks/use-transactions";
import { useFundFlows } from "@/hooks/use-fund-flows";
import { type Transaction, type TransactionFormData } from "@/types/transaction";
import { TransactionTable } from "@/components/ledger/transaction-table";
import { TransactionForm } from "@/components/ledger/transaction-form";
import { FundFlowTable } from "@/components/ledger/fund-flow-table";
import { FundFlowForm } from "@/components/ledger/fund-flow-form";
import { DataExport } from "@/components/ledger/data-export";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, Wallet } from "lucide-react";

export default function LedgerPage() {
  const t = useTranslations("Ledger");
  const tNav = useTranslations("Nav");

  // 交易记录
  const {
    transactions,
    loading: txLoading,
    pagination,
    sort,
    filter,
    setFilter,
    setSort,
    setPagination,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useTransactions();

  // 资金流水
  const {
    fundFlows,
    loading: ffLoading,
    createFundFlow,
    deleteFundFlow,
  } = useFundFlows();

  // 对话框状态
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [ffFormOpen, setFfFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState("transactions");

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxFormOpen(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm(t("confirmDelete"))) {
      await deleteTransaction(id);
    }
  };

  const handleDeleteFundFlow = async (id: string) => {
    if (window.confirm(t("confirmDelete"))) {
      await deleteFundFlow(id);
    }
  };

  const handleSubmitTransaction = async (data: TransactionFormData) => {
    if (editingTx) {
      await updateTransaction(editingTx.id, data);
    } else {
      await createTransaction(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {tNav("ledger")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <DataExport transactions={transactions} fundFlows={fundFlows} />
          {activeTab === "transactions" ? (
            <Button
              size="sm"
              onClick={() => {
                setEditingTx(null);
                setTxFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {t("addTransaction")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setFfFormOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              {t("addFundFlow")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transactions" className="gap-1.5">
            <BookOpen className="w-4 h-4" />
            {t("transactions")}
          </TabsTrigger>
          <TabsTrigger value="fundFlows" className="gap-1.5">
            <Wallet className="w-4 h-4" />
            {t("fundFlows")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-4">
          <TransactionTable
            transactions={transactions}
            loading={txLoading}
            pagination={pagination}
            sort={sort}
            filter={filter}
            onFilterChange={setFilter}
            onSortChange={setSort}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
          />
        </TabsContent>

        <TabsContent value="fundFlows" className="mt-4">
          <FundFlowTable
            fundFlows={fundFlows}
            loading={ffLoading}
            onDelete={handleDeleteFundFlow}
          />
        </TabsContent>
      </Tabs>

      {/* 交易记录表单对话框 */}
      <TransactionForm
        open={txFormOpen}
        onOpenChange={(open) => {
          setTxFormOpen(open);
          if (!open) setEditingTx(null);
        }}
        onSubmit={handleSubmitTransaction}
        initialData={editingTx}
      />

      {/* 资金流水表单对话框 */}
      <FundFlowForm
        open={ffFormOpen}
        onOpenChange={setFfFormOpen}
        onSubmit={createFundFlow}
      />
    </div>
  );
}
