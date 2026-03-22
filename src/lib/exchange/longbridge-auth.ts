import { createClient } from "@/lib/supabase-server";
import { encrypt, decrypt } from "@/lib/crypto";

const LONGBRIDGE_CLIENT_ID = process.env.LONGBRIDGE_CLIENT_ID;
const LONGBRIDGE_CLIENT_SECRET = process.env.LONGBRIDGE_CLIENT_SECRET;
const LONGBRIDGE_REDIRECT_URI =
  process.env.LONGBRIDGE_REDIRECT_URI || "http://localhost:3000/api/auth/longbridge/callback";

export interface LongbridgeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<LongbridgeTokens> {
  const response = await fetch("https://openapi.longbridgeapp.com/v1/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: LONGBRIDGE_CLIENT_ID,
      client_secret: LONGBRIDGE_CLIENT_SECRET,
      redirect_uri: LONGBRIDGE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshLongbridgeToken(refreshToken: string): Promise<LongbridgeTokens> {
  const response = await fetch("https://openapi.longbridgeapp.com/v1/auth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: LONGBRIDGE_CLIENT_ID,
      client_secret: LONGBRIDGE_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

/**
 * Save Longbridge tokens for a user
 */
export async function saveLongbridgeTokens(userId: string, tokens: LongbridgeTokens) {
  const supabase = await createClient();

  const { error } = await supabase.from("api_keys").upsert(
    {
      user_id: userId,
      exchange: "longbridge",
      auth_type: "oauth",
      oauth_access_token_encrypted: encrypt(tokens.accessToken),
      oauth_refresh_token_encrypted: encrypt(tokens.refreshToken),
      oauth_expires_at: tokens.expiresAt.toISOString(),
      label: "Longbridge OAuth",
    },
    { onConflict: "user_id,exchange" }
  );

  if (error) throw error;
}

/**
 * Get valid access token for a user, refreshing if necessary
 */
export async function getValidLongbridgeToken(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: keyData, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("exchange", "longbridge")
    .single();

  if (error || !keyData) {
    throw new Error("Longbridge connection not found");
  }

  const expiresAt = new Date(keyData.oauth_expires_at);
  const now = new Date();

  // If token is expired or expires in less than 5 minutes, refresh it
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    const refreshToken = decrypt(keyData.oauth_refresh_token_encrypted);
    const newTokens = await refreshLongbridgeToken(refreshToken);
    await saveLongbridgeTokens(userId, newTokens);
    return newTokens.accessToken;
  }

  return decrypt(keyData.oauth_access_token_encrypted);
}
