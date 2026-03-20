import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端专用 Supabase 客户端
 * 仅用于 Client Components 中的交互逻辑
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // 仅在开发环境或构建阶段（非生产运行时）允许回退，避免 Crash
    return createBrowserClient(
      url || "https://placeholder.supabase.co",
      anonKey || "placeholder-anon-key"
    );
  }

  return createBrowserClient(url, anonKey);
}
