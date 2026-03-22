import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { exchangeCodeForTokens, saveLongbridgeTokens } from "@/lib/exchange/longbridge-auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = new URL(request.url).origin;

  if (error) {
    return NextResponse.redirect(new URL(`${baseUrl}/settings?error=${encodeURIComponent(error)}`));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`${baseUrl}/settings?error=missing_code`));
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL(`${baseUrl}/login?error=unauthorized`));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Save tokens securely
    await saveLongbridgeTokens(user.id, tokens);

    return NextResponse.redirect(new URL(`${baseUrl}/settings?success=longbridge_connected`));
  } catch (err) {
    console.error("Longbridge OAuth callback error:", err);
    const errorMessage = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      new URL(`${baseUrl}/settings?error=${encodeURIComponent(errorMessage)}`)
    );
  }
}
