import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sendBarkNotification } from "@/lib/bark-trigger";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { bark_server_url?: string; bark_device_key?: string } = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore if body is empty or malformed
    }

    const result = await sendBarkNotification(
      user.id,
      "TradeLens 测试推送",
      "收到此消息说明您的 Bark 配置工作正常。🚀",
      {
        icon: "https://cdn-icons-png.flaticon.com/512/1041/1041916.png",
        overrideConfig: {
          bark_server_url: body.bark_server_url,
          bark_device_key: body.bark_device_key,
        },
      }
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        {
          error: result.error || "Failed to send notification.",
          hint: "Please ensure Bark is enabled in settings and SUPABASE_SERVICE_ROLE_KEY is configured in .env.local",
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Test notification route error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}
