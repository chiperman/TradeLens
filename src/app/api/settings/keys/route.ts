import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * 获取已授权用户
 */
async function getAuthedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
  if (error || !user) return null;

  return { user, supabase };
}

/**
 * GET - 获取用户所有 API Key（不含密钥明文）
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: keys, error } = await auth.supabase
      .from("api_keys")
      .select("id, exchange, auth_type, label, last_sync_at, created_at")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(keys);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "获取失败" },
      { status: 500 }
    );
  }
}

/**
 * POST - 保存 API Key（创建或更新）
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { exchange, apiKey, apiSecret, passphrase, label } = await req.json();
    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    const upsertData: Record<string, unknown> = {
      user_id: auth.user.id,
      exchange,
      auth_type: "api_key",
      api_key_encrypted: encrypt(apiKey),
      api_secret_encrypted: encrypt(apiSecret),
      label: label || "Default",
    };

    if (passphrase) {
      upsertData.passphrase_encrypted = encrypt(passphrase);
    }

    const { error } = await auth.supabase
      .from("api_keys")
      .upsert(upsertData, { onConflict: "user_id, exchange, label" });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "保存失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除指定 API Key
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    const { error } = await auth.supabase
      .from("api_keys")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "删除失败" },
      { status: 500 }
    );
  }
}

/**
 * PUT - 测试连接
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthedUser(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    const { data: key, error: fetchError } = await auth.supabase
      .from("api_keys")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (fetchError || !key) {
      return NextResponse.json({ error: "未找到 API Key" }, { status: 404 });
    }

    const { initializeAdapters, getAdapter } = await import("@/lib/exchange/registry");
    await initializeAdapters();

    const adapter = getAdapter(key.exchange);
    const credentials = {
      apiKey: decrypt(key.api_key_encrypted),
      apiSecret: decrypt(key.api_secret_encrypted),
      passphrase: key.passphrase_encrypted ? decrypt(key.passphrase_encrypted) : undefined,
    };

    const connected = await adapter.testConnection(credentials);
    return NextResponse.json({ connected });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "测试失败" },
      { status: 500 }
    );
  }
}
