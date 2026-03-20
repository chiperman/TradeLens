import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端专用 Supabase 客户端
 * 用于 Route Handlers, Server Actions, 和 Server Components
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在产生响应后无法在服务器组件中设置 Cookie
          }
        },
      },
    }
  );
}
