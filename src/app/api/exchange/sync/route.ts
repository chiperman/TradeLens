import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { SyncManager } from "@/lib/exchange/sync-manager";
import type { ExchangeName } from "@/lib/exchange/types";

/**
 * POST - 触发数据同步
 *
 * 1. 手动模式: Authorization: Bearer <JWT>
 *    Body: { exchange: ExchangeName, symbols?: string[] }
 *
 * 2. Cron 模式: X-App-Cron: <CRON_SECRET>
 *    不带 Body 或带 Body 指定特定范围
 */
export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const isCron = !!cronSecret && req.headers.get("X-App-Cron") === cronSecret;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 使用服务角色客户端以便支持 Cron 批量操作
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const syncManager = new SyncManager(supabaseAdmin);

    // 1. Cron 批量同步任务
    if (isCron) {
      console.log("[API] 接收到 Cron 触发信号，执行全系统同步...");
      const result = await syncManager.syncAllUsers();
      return NextResponse.json(result);
    }

    // 2. 个人用户手动同步任务
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = user.id;

    const { exchange, symbols, isAutomated } = (await req.json()) as {
      exchange: ExchangeName;
      symbols?: string[];
      isAutomated?: boolean;
    };

    if (!exchange) return NextResponse.json({ error: "缺少 exchange 参数" }, { status: 400 });

    const result = await syncManager.syncUserExchange(userId, exchange, {
      symbols,
      isAutomated: !!isAutomated,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("同步接口异常:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "同步失败" },
      { status: 500 }
    );
  }
}
