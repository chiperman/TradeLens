"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type {
  Transaction,
  TransactionFormData,
  TransactionFilter,
  PaginationState,
  SortState,
} from "@/types/transaction";

const PAGE_SIZE = 20;

/**
 * 交易记录 CRUD Hook
 */
export function useTransactions(initialFilter?: TransactionFilter) {
  const supabase = createClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("transactions")
        .select("*", { count: "exact" });

      // 应用筛选
      if (filter.asset_class) {
        query = query.eq("asset_class", filter.asset_class);
      }
      if (filter.exchange) {
        query = query.eq("exchange", filter.exchange);
      }
      if (filter.side) {
        query = query.eq("side", filter.side);
      }
      if (filter.source) {
        query = query.eq("source", filter.source);
      }
      if (filter.symbol) {
        query = query.ilike("symbol", `%${filter.symbol}%`);
      }
      if (filter.date_from) {
        query = query.gte("transacted_at", filter.date_from);
      }
      if (filter.date_to) {
        query = query.lte("transacted_at", filter.date_to);
      }

      // 排序
      query = query.order(sort.column, { ascending: sort.direction === "asc" });

      // 分页
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setTransactions((data as Transaction[]) ?? []);
      setPagination((prev) => ({
        ...prev,
        total: count ?? 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, sort, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = useCallback(
    async (data: TransactionFormData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const quoteQuantity = data.price * data.quantity;

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: user.user.id,
        symbol: data.symbol,
        asset_name: data.asset_name || null,
        asset_class: data.asset_class,
        market: data.market || null,
        exchange: data.exchange,
        side: data.side,
        price: data.price,
        quantity: data.quantity,
        quote_quantity: quoteQuantity,
        commission: data.commission ?? 0,
        commission_currency: data.commission_currency ?? "USD",
        source: "manual",
        notes: data.notes || null,
        transacted_at: data.transacted_at,
      });

      if (insertError) throw insertError;
      await fetchTransactions();
    },
    [supabase, fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<TransactionFormData>) => {
      const updateData: Record<string, unknown> = { ...data };
      if (data.price !== undefined && data.quantity !== undefined) {
        updateData.quote_quantity = data.price * data.quantity;
      }

      const { error: updateError } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;
      await fetchTransactions();
    },
    [supabase, fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      await fetchTransactions();
    },
    [supabase, fetchTransactions]
  );

  return {
    transactions,
    loading,
    error,
    pagination,
    sort,
    filter,
    setFilter,
    setSort,
    setPagination,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}
