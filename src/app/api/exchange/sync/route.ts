import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/crypto";
import { initializeAdapters, getAdapter } from "@/lib/exchange/registry";
import type { ExchangeName, NormalizedTrade, NormalizedFundFlow } from "@/lib/exchange/types";
import { sendBarkNotification } from "@/lib/bark-trigger";

/**
 * POST - 触发指定交易所的数据同步
 *
 * Body: { exchange: ExchangeName, symbols?: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 身份验证
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. 解析请求参数
    const { exchange, symbols } = (await req.json()) as {
      exchange: ExchangeName;
      symbols?: string[];
    };
    if (!exchange) return NextResponse.json({ error: "缺少 exchange 参数" }, { status: 400 });

    // 3. 获取加密的 API Key
    const { data: keyRecord, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .eq("exchange", exchange)
      .single();

    if (keyError || !keyRecord) {
      return NextResponse.json({ error: `请先在设置中绑定 ${exchange} API Key` }, { status: 404 });
    }

    // 4. 解密凭证
    const credentials = {
      apiKey: decrypt(keyRecord.api_key_encrypted),
      apiSecret: decrypt(keyRecord.api_secret_encrypted),
      passphrase: keyRecord.passphrase_encrypted
        ? decrypt(keyRecord.passphrase_encrypted)
        : undefined,
    };

    // 5. 初始化适配器并拉取数据
    await initializeAdapters();
    const adapter = getAdapter(exchange);

    const syncParams = {
      symbols,
      startTime: keyRecord.last_sync_at ? new Date(keyRecord.last_sync_at).getTime() : undefined,
    };

    const [trades, deposits, withdrawals] = await Promise.all([
      adapter.fetchTrades(credentials, syncParams),
      adapter.fetchDeposits(credentials),
      adapter.fetchWithdrawals(credentials),
    ]);

    // 6. 写入交易记录（去重）
    const tradesInserted = await upsertTrades(supabase, user.id, trades);

    // 7. 写入资金流水
    const fundFlowsInserted = await insertFundFlows(supabase, user.id, [
      ...deposits,
      ...withdrawals,
    ]);

    // 8. 更新最后同步时间
    await supabase
      .from("api_keys")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", keyRecord.id);

    // 9. 触发 Bark 异步通知
    if (tradesInserted > 0 || fundFlowsInserted > 0) {
      sendBarkNotification(
        user.id,
        "🔄 TradeLens 同步完成",
        `[${exchange.toUpperCase()}] 成功同步 ${tradesInserted} 笔交易, ${fundFlowsInserted} 笔资金流水。`
      ).catch(console.error); // 异步不阻塞
    }

    return NextResponse.json({
      success: true,
      tradesCount: tradesInserted,
      fundFlowsCount: fundFlowsInserted,
    });
  } catch (err) {
    console.error("同步失败:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "同步失败" },
      { status: 500 }
    );
  }
}

/**
 * 去重插入交易记录
 */
async function upsertTrades(
  supabase: SupabaseClient,
  userId: string,
  trades: NormalizedTrade[]
): Promise<number> {
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

  const { error } = await supabase
    .from("transactions")
    .upsert(rows, { onConflict: "user_id, exchange, external_trade_id" });

  if (error) {
    console.error("交易记录写入失败:", error);
    return 0;
  }

  return rows.length;
}

/**
 * 插入资金流水（简单去重：检查时间+金额+交易所）
 */
async function insertFundFlows(
  supabase: SupabaseClient,
  userId: string,
  flows: NormalizedFundFlow[]
): Promise<number> {
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

  const { error } = await supabase.from("fund_flows").insert(rows);

  if (error) {
    console.error("资金流水写入失败:", error);
    return 0;
  }

  return rows.length;
}
