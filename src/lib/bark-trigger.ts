import { createClient } from "@supabase/supabase-js";

// Helper to initialize a Supabase admin client lazily to avoid build-time errors
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase admin credentials missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function sendBarkNotification(
  userId: string,
  title: string,
  body: string,
  icon?: string
) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // 1. Fetch user's notification config
    const { data: config, error } = await supabaseAdmin
      .from("notification_config")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !config || !config.is_enabled || !config.bark_device_key) {
      console.warn("Notification not enabled or configured for user", userId);
      return false; // Silently abort, user disabled or not configured
    }

    // 2. Prepare Bark request
    const serverUrl = config.bark_server_url || "https://api.day.app";
    const url = new URL(
      `/${config.bark_device_key}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`,
      serverUrl
    );
    url.searchParams.append("group", "TradeLens");
    if (icon) {
      url.searchParams.append("icon", icon);
    }

    // 3. Send Request
    const response = await fetch(url.toString(), { method: "GET" });
    const isSuccess = response.ok;
    let errorMessage = null;

    if (!isSuccess) {
      const resData = await response.json().catch(() => ({}));
      errorMessage = resData.message || `HTTP Error: ${response.status}`;
      console.error("Bark Notification failed:", errorMessage);
    }

    // 4. Log the notification
    await supabaseAdmin.from("notification_logs").insert({
      user_id: userId,
      title,
      body,
      status: isSuccess ? "success" : "failed",
      error_message: errorMessage,
    });

    return isSuccess;
  } catch (err) {
    console.error("Error sending Bark notification:", err);

    // Attempt to log the error if DB is reachable
    try {
      await supabaseAdmin.from("notification_logs").insert({
        user_id: userId,
        title,
        body,
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      });
    } catch (logErr) {
      console.error("Failed to log notification error:", logErr);
    }

    return false;
  }
}
