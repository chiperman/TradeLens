import { type SupabaseClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/crypto";
import { getExchangeAdapter } from "./adapter-factory";
import { sendBarkNotification } from "@/lib/bark-trigger";
import type { ExchangeName, NormalizedTrade, NormalizedFundFlow } from "./types";

/**
 * 交易所同步管理器
 * 封装了从 API 获取数据、去重校验、写入数据库及通知的全流程
 */
export class SyncManager {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * 同步指定用户的特定交易所数据
   */
  async syncUserExchange(
    userId: string,
    exchange: ExchangeName,
    options: { isAutomated?: boolean; symbols?: string[] } = {}
  ) {
    const syncId = crypto.randomUUID();
    // const startTime = Date.now();

    try {
      // 1. 获取 API Key
      const { data: keyRecord, error: keyError } = await this.supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", userId)
        .eq("exchange", exchange)
        .single();

      if (keyError || !keyRecord) {
        throw new Error(`未找到 ${exchange} 的 API Key 配置`);
      }

      // 2. 初始化适配器与凭证
      const adapter = await getExchangeAdapter(exchange);
      const credentials = {
        apiKey: keyRecord.api_key_encrypted ? decrypt(keyRecord.api_key_encrypted) : undefined,
        apiSecret: keyRecord.api_secret_encrypted
          ? decrypt(keyRecord.api_secret_encrypted)
          : undefined,
        passphrase: keyRecord.passphrase_encrypted
          ? decrypt(keyRecord.passphrase_encrypted)
          : undefined,
        accessToken: keyRecord.oauth_access_token_encrypted
          ? decrypt(keyRecord.oauth_access_token_encrypted)
          : undefined,
        refreshToken: keyRecord.oauth_refresh_token_encrypted
          ? decrypt(keyRecord.oauth_refresh_token_encrypted)
          : undefined,
        userId: userId,
      };

      // 3. 记录同步开始
      await this.supabase.from("sync_history").insert({
        id: syncId,
        user_id: userId,
        exchange,
        status: "pending",
        is_automated: !!options.isAutomated,
        started_at: new Date().toISOString(),
      });

      // 4. 执行抓取
      const syncParams = {
        symbols: options.symbols,
        startTime: keyRecord.last_sync_at ? new Date(keyRecord.last_sync_at).getTime() : undefined,
      };

      const [trades, deposits, withdrawals] = await Promise.all([
        adapter.fetchTrades(credentials, syncParams),
        adapter.fetchDeposits(credentials),
        adapter.fetchWithdrawals(credentials),
      ]);

      // 5. 写入数据
      const tradesInserted = await this.upsertTrades(userId, trades);
      const fundFlowsInserted = await this.insertFundFlows(userId, [...deposits, ...withdrawals]);

      // 6. 更新最后同步时间
      await this.supabase
        .from("api_keys")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", keyRecord.id);

      // 7. 更新同步记录为成功
      await this.supabase
        .from("sync_history")
        .update({
          status: "success",
          trades_count: tradesInserted,
          fund_flows_count: fundFlowsInserted,
          completed_at: new Date().toISOString(),
        })
        .eq("id", syncId);

      // 8. 触发通知 (仅在有新数据或手动触发时)
      if (tradesInserted > 0 || fundFlowsInserted > 0 || !options.isAutomated) {
        await sendBarkNotification(
          userId,
          `🔄 ${exchange.toUpperCase()} 同步完成`,
          `成功同步 ${tradesInserted} 笔交易, ${fundFlowsInserted} 笔资金流水。`
        ).catch(console.error);
      }

      return { success: true, tradesInserted, fundFlowsInserted };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      console.error(`[SyncManager] ${exchange} 同步失败:`, err);

      // 记录失败
      await this.supabase.from("sync_history").upsert({
        id: syncId,
        user_id: userId,
        exchange,
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });

      // 发起失败告警通知
      await sendBarkNotification(
        userId,
        `⚠️ ${exchange.toUpperCase()} 同步失败`,
        `原因: ${errorMessage}。请检查 API Key 是否有效。`
      ).catch(console.error);

      throw err;
    }
  }

  /**
   * 同步系统中所有活跃用户的交易所数据 (Cron 任务调用)
   */
  async syncAllUsers() {
    const startTime = Date.now();
    console.log("[SyncManager] 开始执行全系统批量同步...");

    try {
      // 1. 获取所有有效的 API Key 配置的用户与交易所组合
      const { data: keys, error: keysError } = await this.supabase
        .from("api_keys")
        .select("user_id, exchange");

      if (keysError) throw keysError;
      if (!keys || keys.length === 0) {
        console.log("[SyncManager] 未找到待同步的 API Key");
        return { success: true, count: 0 };
      }

      console.log(`[SyncManager] 发现 ${keys.length} 个同步任务，准备并行执行...`);

      // 2. 并行同步 (带错误捕获，避免单用户失败导致全部中断)
      // TODO: 如果用户量大，这里应引入 p-limit 控制并发
      const results = await Promise.allSettled(
        keys.map((k) =>
          this.syncUserExchange(k.user_id, k.exchange as ExchangeName, { isAutomated: true })
        )
      );

      const successCount = results.filter((r) => r.status === "fulfilled").length;
      const failedCount = results.filter((r) => r.status === "rejected").length;

      console.log(
        `[SyncManager] 批量同步完成。成功: ${successCount}, 失败: ${failedCount}, 耗时: ${
          Date.now() - startTime
        }ms`
      );

      return { success: true, successCount, failedCount };
    } catch (err) {
      console.error("[SyncManager] 批量同步过程中发生致命错误:", err);
      throw err;
    }
  }

  private async upsertTrades(userId: string, trades: NormalizedTrade[]): Promise<number> {
    if (trades.length === 0) return 0;
    const rows = trades.map((t) => ({
      user_id: userId,
      symbol: t.symbol,
      asset_class: t.assetClass,
      market: t.market || null,
      exchange: t.exchange,
      side: t.side,
      price: t.price,
      quantity: t.quantity,
      quote_quantity: t.quoteQuantity,
      commission: t.commission,
      commission_asset: t.commissionAsset,
      source: "auto",
      external_trade_id: t.externalTradeId,
      external_order_id: t.externalOrderId || null,
      transacted_at: t.transactedAt.toISOString(),
    }));

    const { error } = await this.supabase
      .from("transactions")
      .upsert(rows, { onConflict: "user_id, exchange, external_trade_id" });

    return error ? 0 : rows.length;
  }

  private async insertFundFlows(userId: string, flows: NormalizedFundFlow[]): Promise<number> {
    if (flows.length === 0) return 0;
    const rows = flows.map((f) => ({
      user_id: userId,
      exchange: f.exchange,
      direction: f.direction,
      amount: f.amount,
      currency: f.currency,
      notes: f.txId ? `TxID: ${f.txId}` : null,
      transacted_at: f.transactedAt.toISOString(),
    }));

    const { error } = await this.supabase.from("fund_flows").insert(rows);
    return error ? 0 : rows.length;
  }
}
