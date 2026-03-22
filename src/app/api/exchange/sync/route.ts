import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { SyncManager } from "@/lib/exchange/sync-manager";
import type { ExchangeName } from "@/lib/exchange/types";

/**
 * POST - 触发指定交易所的数据同步
 *
 * Body: { exchange: ExchangeName, symbols?: string[], isAutomated?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const isCron = req.headers.get("X-App-Cron") === process.env.CRON_SECRET;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 使用服务角色客户端以便支持 Cron 批量操作(可选)或绕过 RLS 写入日志
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 身份验证 (支持 JWT 或 Cron Secret)
    if (isCron) {
      // TODO: 实现根据 Cron 触发逻辑同步多用户
      return NextResponse.json({ error: "Cron batch support in progress" }, { status: 501 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    // 2. 解析参数
    const { exchange, symbols, isAutomated } = (await req.json()) as {
      exchange: ExchangeName;
      symbols?: string[];
      isAutomated?: boolean;
    };
    if (!exchange) return NextResponse.json({ error: "缺少 exchange 参数" }, { status: 400 });

    // 3. 使用 SyncManager 执行同步
    const syncManager = new SyncManager(supabaseAdmin);
    const result = await syncManager.syncUserExchange(userId, exchange, {
      symbols,
      isAutomated,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("同步失败:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "同步失败" },
      { status: 500 }
    );
  }
}
