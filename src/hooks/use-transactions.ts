"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/providers/user-provider";
import type {
  Transaction,
  TransactionFormData,
  TransactionFilter,
  PaginationState,
  SortState,
} from "@/types/transaction";
import { useDataQuery } from "./base/use-data-query";
import type { User } from "@supabase/supabase-js";

const PAGE_SIZE = 20;

/**
 * 交易记录 CRUD Hook
 */
const supabase = createClient();

export function useTransactions(initialFilter?: TransactionFilter) {
  const { user: contextUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<TransactionFilter>(initialFilter ?? {});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
  });
  const [sort, setSort] = useState<SortState>({
    column: "transacted_at",
    direction: "desc",
  });

  useEffect(() => {
    setUser(contextUser);
  }, [contextUser]);

  const range = useMemo(() => {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    return { from, to };
  }, [pagination.page, pagination.pageSize]);

  const order = useMemo(
    () => ({ column: sort.column, ascending: sort.direction === "asc" }),
    [sort.column, sort.direction]
  );

  const {
    data: transactions,
    count: totalCount,
    loading,
    refresh,
  } = useDataQuery<Transaction>({
    table: "transactions",
    filters: filter,
    order,
    range,
    enabled: !!user,
  });

  const paginationWithTotal = useMemo(
    () => ({
      ...pagination,
      total: totalCount,
    }),
    [pagination, totalCount]
  );

  const createTransaction = useCallback(
    async (formData: TransactionFormData) => {
      if (!user) throw new Error("Not authenticated");
      const quoteQuantity = formData.price * formData.quantity;

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: user.id,
        symbol: formData.symbol,
        asset_name: formData.asset_name || null,
        asset_class: formData.asset_class,
        market: formData.market || null,
        exchange: formData.exchange,
        side: formData.side,
        price: formData.price,
        quantity: formData.quantity,
        quote_quantity: quoteQuantity,
        commission: formData.commission ?? 0,
        commission_currency: formData.commission_currency ?? "USD",
        source: "manual",
        notes: formData.notes || null,
        transacted_at: formData.transacted_at,
      });

      if (insertError) throw insertError;
      await refresh();
    },
    [supabase, user, refresh]
  );

  const bulkCreateTransactions = useCallback(
    async (txs: TransactionFormData[]) => {
      if (!user) throw new Error("Not authenticated");

      const insertData = txs.map((formData) => ({
        user_id: user.id,
        symbol: formData.symbol,
        asset_name: formData.asset_name || null,
        asset_class: formData.asset_class,
        market: formData.market || null,
        exchange: formData.exchange,
        side: formData.side,
        price: formData.price,
        quantity: formData.quantity,
        quote_quantity: formData.price * formData.quantity,
        commission: formData.commission ?? 0,
        commission_currency: formData.commission_currency ?? "USD",
        source: "import",
        notes: formData.notes || null,
        transacted_at: formData.transacted_at,
      }));

      const { error: insertError } = await supabase.from("transactions").insert(insertData);
      if (insertError) throw insertError;
      await refresh();
    },
    [supabase, user, refresh]
  );

  const updateTransaction = useCallback(
    async (id: string, formData: Partial<TransactionFormData>) => {
      const updateData: Record<string, unknown> = { ...formData };
      if (formData.price !== undefined && formData.quantity !== undefined) {
        updateData.quote_quantity = formData.price * formData.quantity;
      }

      const { error: updateError } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase.from("transactions").delete().eq("id", id);
      if (deleteError) throw deleteError;
      await refresh();
    },
    [supabase, refresh]
  );

  return {
    transactions,
    loading,
    pagination: paginationWithTotal,
    sort,
    filter,
    setFilter,
    setSort,
    setPagination,
    createTransaction,
    bulkCreateTransactions,
    updateTransaction,
    deleteTransaction,
    refresh,
  };
}
