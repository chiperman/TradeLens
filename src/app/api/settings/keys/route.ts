import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { exchange, apiKey, apiSecret, label } = await req.json();
    if (!exchange || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 加密
    const encryptedKey = encrypt(apiKey);
    const encryptedSecret = encrypt(apiSecret);

    const { error } = await supabase
      .from("api_keys")
      .upsert({
        user_id: user.id,
        exchange,
        api_key_encrypted: encryptedKey,
        api_secret_encrypted: encryptedSecret,
        label: label || "Default",
      }, { onConflict: "user_id, exchange, label" });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Save failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: keys, error } = await supabase
      .from("api_keys")
      .select("id, exchange, label, created_at")
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(keys);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fetch failed" }, { status: 500 });
  }
}
