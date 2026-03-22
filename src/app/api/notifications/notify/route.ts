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

    const { title, body } = await req.json();

    const success = await sendBarkNotification(
      user.id,
      title,
      body,
      "https://cdn-icons-png.flaticon.com/512/1041/1041916.png"
    );

    return NextResponse.json({ success });
  } catch (err) {
    console.error("Notification trigger route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
