import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { BinanceAdapter } from "@/lib/exchange/binance";

// 注意：生产环境下 API Secret 因该是加密存储的，此处仅作为逻辑演示
// Phase 3 核心任务是实现稳健的同步。

export async function POST(req: NextRequest) {
  try {
    // 1. 获取授权信息
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

    // 2. 从数据库获取 API Key
    const { data: keys, error: keyError } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .eq("exchange", "binance")
      .single();

    if (keyError || !keys) {
      return NextResponse.json({ error: "请先在设置中绑定 Binance API Key" }, { status: 404 });
    }

    const { decrypt } = await import("@/lib/crypto");
    const apiKey = decrypt(keys.api_key_encrypted);
    const apiSecret = decrypt(keys.api_secret_encrypted);

    // 3. 执行同步逻辑 (使用统一适配器)
    const adapter = new BinanceAdapter();
    const creds = { apiKey, apiSecret };
    const trades = await adapter.fetchTrades(creds, {
      symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    });

    // 4. 将数据批量转换并写入 transactions 表
    if (trades && trades.length > 0) {
      const mapped = trades.map((t) => ({
        user_id: user.id,
        symbol: t.symbol,
        asset_class: t.assetClass,
        exchange: t.exchange,
        side: t.side,
        price: t.price,
        quantity: t.quantity,
        quote_quantity: t.quoteQuantity,
        commission: t.commission,
        commission_asset: t.commissionAsset,
        trade_id: t.externalTradeId,
        order_id: t.externalOrderId,
        transacted_at: t.transactedAt.toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("transactions")
        .upsert(mapped, { onConflict: "user_id, trade_id" });

      if (insertError) throw insertError;

      return NextResponse.json({ success: true, count: trades.length });
    }

    return NextResponse.json({ success: true, count: 0 });
  } catch (err) {
    console.error("Sync failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
