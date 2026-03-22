import crypto from "crypto";
import { ExchangeCredentials } from "../types";

export type SigningStrategy = (
  timestamp: string,
  method: string,
  path: string,
  body: string,
  secret: string
) => string;

export interface HttpClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  signingStrategy: SigningStrategy;
  timestampHeader?: string;
  signatureHeader: string;
  apiKeyHeader: string;
  passphraseHeader?: string;
  signatureLocation?: "header" | "query";
}

export class ExchangeHttpClient {
  constructor(private options: HttpClientOptions) {}

  async request<T>(
    method: string,
    path: string,
    creds: ExchangeCredentials,
    params: Record<string, string | number> = {},
    body: unknown = null
  ): Promise<T> {
    const timestamp = Date.now().toString();
    const cleanParams = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]));

    // For Binance, timestamp must be in query string
    if (this.options.signatureLocation === "query") {
      cleanParams.timestamp = timestamp;
    }

    const qs = new URLSearchParams(cleanParams).toString();
    const fullPath = qs ? `${path}?${qs}` : path;
    const bodyStr = body ? JSON.stringify(body) : "";

    const signature = this.options.signingStrategy(
      timestamp,
      method,
      fullPath,
      bodyStr,
      creds.apiSecret!
    );

    const headers: Record<string, string> = {
      ...this.options.headers,
      [this.options.apiKeyHeader]: creds.apiKey!,
    };

    if (this.options.signatureLocation === "query") {
      const finalUrl = `${this.options.baseUrl}${fullPath}${fullPath.includes("?") ? "&" : "?"}signature=${signature}`;
      const response = await fetch(finalUrl, { method, headers, body: body ? bodyStr : undefined });
      return this.handleResponse<T>(response);
    }

    headers[this.options.signatureHeader] = signature;
    if (this.options.timestampHeader) {
      headers[this.options.timestampHeader] = timestamp;
    }
    if (this.options.passphraseHeader && creds.passphrase) {
      headers[this.options.passphraseHeader] = creds.passphrase;
    }

    const url = `${this.options.baseUrl}${fullPath}`;
    const response = await fetch(url, { method, headers, body: body ? bodyStr : undefined });
    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ msg: `HTTP ${response.status}` }));
      throw new Error(err.msg || err.message || `Exchange API Error ${response.status}`);
    }
    const json = await response.json();
    return (json.data !== undefined ? json.data : json) as T;
  }
}

// 常用签名库
export const SigningStrategies = {
  // Binance: HMAC SHA256, signature is hex appended to QS
  binance: (timestamp: string, method: string, path: string, body: string, secret: string) => {
    // Note: Binance usually appends signature to the query string itself.
    // This HttpClient might need a small tweak for it, or we handle it in the adapter.
    return crypto
      .createHmac("sha256", secret)
      .update(path + (path.includes("?") ? "&" : "?") + `timestamp=${timestamp}`)
      .digest("hex");
  },

  // OKX: HMAC SHA256, Base64 output
  okx: (timestamp: string, method: string, path: string, body: string, secret: string) => {
    const preHash = timestamp + method.toUpperCase() + path + body;
    return crypto.createHmac("sha256", secret).update(preHash).digest("base64");
  },

  // Bitget: HMAC SHA256, Base64 output
  bitget: (timestamp: string, method: string, path: string, body: string, secret: string) => {
    const preHash = timestamp + method.toUpperCase() + path + body;
    return crypto.createHmac("sha256", secret).update(preHash).digest("base64");
  },
};
