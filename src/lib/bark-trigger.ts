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
  options?: {
    icon?: string;
    overrideConfig?: {
      bark_server_url?: string;
      bark_device_key?: string;
    };
  }
): Promise<{ success: boolean; error?: string }> {
  console.log(`[Notification] Triggered for user: ${userId}`);
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (initErr) {
    const msg = initErr instanceof Error ? initErr.message : "Supabase Admin init failed";
    console.error("[Notification] Failed to initialize Supabase Admin:", msg);
    return { success: false, error: msg };
  }

  try {
    let serverUrl: string;
    let deviceKey: string;
    let isEnabled: boolean = true;

    // Use override config if provided (typically for unsaved tests)
    if (options?.overrideConfig?.bark_device_key) {
      console.log("[Notification] Using provided configuration overrides.");
      serverUrl = options.overrideConfig.bark_server_url || "https://api.day.app";
      deviceKey = options.overrideConfig.bark_device_key;
      isEnabled = true; // Implicitly enabled if testing
    } else {
      // Fetch from database
      const { data: config, error } = await supabaseAdmin
        .from("notification_config")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("[Notification] Config fetch error:", error.message);
        return { success: false, error: `Config fetch error: ${error.message}` };
      }

      if (!config) {
        return { success: false, error: "No notification configuration found." };
      }

      if (!config.is_enabled) {
        return { success: false, error: "Notifications are disabled in your settings." };
      }

      if (!config.bark_device_key) {
        return { success: false, error: "Bark device key is not configured." };
      }

      serverUrl = config.bark_server_url || "https://api.day.app";
      deviceKey = config.bark_device_key;
      isEnabled = config.is_enabled;
    }

    if (!isEnabled) {
      return { success: false, error: "Notification disabled." };
    }

    // 2. Prepare Bark request
    const maskedKey =
      deviceKey.substring(0, 4) + "****" + deviceKey.substring(deviceKey.length - 4);
    const url = new URL(
      `/${deviceKey}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`,
      serverUrl
    );
    url.searchParams.append("group", "TradeLens");
    if (options?.icon) {
      url.searchParams.append("icon", options.icon);
    }

    console.log(`[Notification] Sending to Bark: ${serverUrl} (Key: ${maskedKey})`);

    // 3. Send Request
    const response = await fetch(url.toString(), { method: "GET" });
    const isSuccess = response.ok;
    let errorMessage = null;

    if (!isSuccess) {
      const resData = await response.json().catch(() => ({}));
      errorMessage = resData.message || `HTTP Error: ${response.status}`;
      console.error("[Notification] Bark API failed:", errorMessage);
    } else {
      console.log("[Notification] Bark API responded successfully.");
    }

    // 4. Log the notification
    const { error: logError } = await supabaseAdmin.from("notification_logs").insert({
      user_id: userId,
      title,
      body,
      status: isSuccess ? "success" : "failed",
      error_message: errorMessage,
    });

    if (logError) {
      console.error("[Notification] Failed to save log to DB:", logError.message);
    }

    return {
      success: isSuccess,
      error: errorMessage || undefined,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("[Notification] Critical error:", errorMsg);

    try {
      if (supabaseAdmin) {
        await supabaseAdmin.from("notification_logs").insert({
          user_id: userId,
          title,
          body,
          status: "failed",
          error_message: errorMsg,
        });
      }
    } catch (logErr) {
      console.error("[Notification] Failed to log notification error to DB:", logErr);
    }

    return { success: false, error: errorMsg };
  }
}
