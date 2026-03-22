import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase";

const supabase = createClient();

interface UseDataQueryOptions {
  table: string;
  select?: string;
  order?: { column: string; ascending?: boolean };
  filters?: Record<string, unknown>;
  range?: { from: number; to: number };
  limit?: number;
  enabled?: boolean;
}

export function useDataQuery<T>(options: UseDataQueryOptions) {
  const { table, select, order, filters, range, limit, enabled } = options;
  const [data, setData] = useState<T[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(enabled !== false);
  const [error, setError] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const fetchData = useCallback(async () => {
    if (enabled === false) return;
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select || "*", { count: "exact" });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (typeof value === "string" && (key === "symbol" || key.includes("name"))) {
              query = query.ilike(key, `%${value}%`);
            } else if (key.startsWith("date_from")) {
              query = query.gte("transacted_at", value);
            } else if (key.startsWith("date_to")) {
              query = query.lte("transacted_at", value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? false });
      }

      if (range) {
        query = query.range(range.from, range.to);
      } else if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: fetchError, count: totalCount } = await query;

      if (fetchError) throw fetchError;
      setData((result as T[]) || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [table, select, enabled, filters, order, range, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, count, loading, error, refresh: fetchData };
}
