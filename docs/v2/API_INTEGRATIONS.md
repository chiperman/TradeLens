# TradeLens V2 — 外部 API 接入规格

> **版本**：2.0.0-draft  
> **日期**：2026-03-21

---

## 1. 接入总览

```
┌─────────────────────────────────────────────────────────┐
│                    TradeLens V2                         │
├───────┬───────┬─────────┬─────────┬────────┬───────────┤
│  LB   │  BN   │   BG    │   OKX   │  Bark  │  FX Rate  │
│ OAuth │ HMAC  │  HMAC   │  HMAC   │ HTTP   │  HTTP     │
└───┬───┴───┬───┴────┬────┴────┬────┴───┬────┴─────┬─────┘
    │       │        │         │        │          │
    ▼       ▼        ▼         ▼        ▼          ▼
 Longbridge Binance  Bitget    OKX    Bark App   Open API
 OpenAPI    REST     REST      REST   (iOS)      (汇率)
```

---

## 2. Longbridge OpenAPI

### 2.1 概要

| 属性 | 值 |
|------|-----|
| 官方文档 | https://open.longportapp.com/docs |
| Node.js SDK | `longport` (npm) |
| 认证方式 | **OAuth 2.0**（推荐）|
| 支持市场 | 美股 / 港股 / 美股期权 |
| API 类型 | REST + WebSocket (实时行情) |

### 2.2 使用的 API 端点

#### 行情数据 (Quote)

| API | 用途 | 频率 |
|-----|------|------|
| `GET /v1/quote/realtime` | 实时行情（持仓标的） | WebSocket 持续推送 |
| `GET /v1/quote/static_info` | 标的基本信息（名称、市场） | 按需 |
| `GET /v1/quote/candlesticks` | K 线数据 | 图表使用 |

#### 交易数据 (Trade)

| API | 用途 | 频率 |
|-----|------|------|
| `GET /v1/trade/execution/today` | 今日成交 | 同步时 |
| `GET /v1/trade/execution/history` | 历史成交 | 同步时 |
| `GET /v1/trade/order/history` | 历史订单 | 同步时 |

#### 持仓与账户 (Portfolio)

| API | 用途 | 频率 |
|-----|------|------|
| `GET /v1/asset/stock` | 股票持仓 | 同步时 |
| `GET /v1/asset/account` | 账户资金 | 同步时 |
| `GET /v1/asset/fund` | 资金明细 | 入金/出金记录 |

#### 公司行为 (Corporate Action)

| API | 用途 | 频率 |
|-----|------|------|
| `GET /v1/asset/corporate_action` | 分红/拆股/合股 | 定期检查 |

### 2.3 OAuth 2.0 流程

```
1. 用户点击「连接 Longbridge」
2. 重定向到 Longbridge OAuth 授权页
3. 用户授权后重定向回 /api/auth/callback/longbridge
4. 使用 authorization_code 换取 access_token + refresh_token
5. 存储 refresh_token（加密）到 api_keys 表
6. access_token 过期后自动使用 refresh_token 刷新
```

### 2.4 实时行情 WebSocket

```typescript
// 伪代码 - Longbridge 实时行情订阅
import { Config, QuoteContext } from 'longport';

const config = Config.fromEnv();  // 或从数据库读取
const ctx = await QuoteContext.create(config);

// 订阅持仓标的
await ctx.subscribe(['AAPL.US', '0700.HK'], [SubType.Quote], true);

// 接收推送
ctx.setOnQuote((symbol, event) => {
  // 推送到前端 (通过 Server-Sent Events)
});
```

---

## 3. Binance API

### 3.1 概要

| 属性 | 值 |
|------|-----|
| 官方文档 | https://developers.binance.com/docs |
| 认证方式 | HMAC SHA256 签名 |
| API 类型 | REST + WebSocket |

### 3.2 使用的 API 端点

| API | 用途 | 说明 |
|-----|------|------|
| `GET /api/v3/myTrades` | 历史成交 | 需签名 |
| `GET /api/v3/account` | 账户信息/持仓 | 需签名 |
| `GET /api/v3/ticker/price` | 实时价格 | 公开 |
| `wss://stream.binance.com` | 实时行情 WebSocket | 公开 |
| `GET /sapi/v1/capital/deposit/hisrec` | 充值记录 | 需签名 |
| `GET /sapi/v1/capital/withdraw/history` | 提现记录 | 需签名 |

### 3.3 签名方式

```typescript
// V1 已实现，沿用 src/lib/binance.ts
import crypto from 'crypto';

function sign(queryString: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}
```

---

## 4. Bitget API

### 4.1 概要

| 属性 | 值 |
|------|-----|
| 官方文档 | https://www.bitget.com/api-doc |
| 认证方式 | HMAC SHA256 签名 + Passphrase |
| API 类型 | REST + WebSocket |

### 4.2 使用的 API 端点

| API | 用途 | 说明 |
|-----|------|------|
| `GET /api/v2/spot/trade/fills` | 现货成交记录 | 需签名 |
| `GET /api/v2/spot/account/assets` | 现货资产 | 需签名 |
| `GET /api/v2/spot/market/tickers` | 行情 | 公开 |
| `wss://ws.bitget.com/v2/ws/public` | 实时行情 | 公开 |
| `GET /api/v2/spot/wallet/deposit-records` | 充值记录 | 需签名 |
| `GET /api/v2/spot/wallet/withdrawal-records` | 提现记录 | 需签名 |

### 4.3 签名方式

```typescript
// Bitget 签名: HMAC SHA256 (timestamp + method + requestPath + body)
function signBitget(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): string {
  const preHash = timestamp + method.toUpperCase() + requestPath + body;
  return crypto.createHmac('sha256', secretKey).update(preHash).digest('base64');
}

// Headers 需包含:
// ACCESS-KEY: apiKey
// ACCESS-SIGN: signature
// ACCESS-TIMESTAMP: timestamp
// ACCESS-PASSPHRASE: passphrase
```

---

## 5. OKX API

### 5.1 概要

| 属性 | 值 |
|------|-----|
| 官方文档 | https://www.okx.com/docs-v5 |
| 认证方式 | HMAC SHA256 签名 + Passphrase |
| API 类型 | REST + WebSocket |

### 5.2 使用的 API 端点

| API | 用途 | 说明 |
|-----|------|------|
| `GET /api/v5/trade/fills-history` | 成交明细 | 需签名 |
| `GET /api/v5/account/balance` | 资金账户余额 | 需签名 |
| `GET /api/v5/market/ticker` | 行情 | 公开 |
| `wss://ws.okx.com:8443/ws/v5/public` | 实时行情 | 公开 |
| `GET /api/v5/asset/deposit-history` | 充值记录 | 需签名 |
| `GET /api/v5/asset/withdrawal-history` | 提现记录 | 需签名 |

### 5.3 签名方式

```typescript
// OKX 签名: HMAC SHA256 (timestamp + method + requestPath + body) -> Base64
function signOKX(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string,
  secretKey: string
): string {
  const preHash = timestamp + method.toUpperCase() + requestPath + (body || '');
  return crypto.createHmac('sha256', secretKey).update(preHash).digest('base64');
}

// Headers:
// OK-ACCESS-KEY: apiKey
// OK-ACCESS-SIGN: signature
// OK-ACCESS-TIMESTAMP: ISO 8601 timestamp
// OK-ACCESS-PASSPHRASE: passphrase
```

---

## 6. Bark 推送

### 6.1 概要

| 属性 | 值 |
|------|-----|
| 官方文档 | https://bark.day.app |
| 协议 | HTTP GET/POST |
| 平台 | iOS |

### 6.2 推送接口

```typescript
// Bark 推送封装
async function sendBarkNotification(
  serverUrl: string,
  deviceKey: string,
  title: string,
  body: string,
  options?: {
    group?: string;      // 通知分组
    icon?: string;       // 自定义图标
    sound?: string;      // 声音
    url?: string;        // 点击跳转 URL
    level?: 'active' | 'timeSensitive' | 'passive';
  }
): Promise<void> {
  const url = `${serverUrl}/${deviceKey}`;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      body,
      group: options?.group || 'TradeLens',
      icon: options?.icon,
      sound: options?.sound || 'default',
      url: options?.url,
      level: options?.level || 'active',
    }),
  });
}
```

### 6.3 触发场景

| 触发条件 | 消息标题 | 消息内容示例 |
|---------|---------|-------------|
| 日涨幅超阈值 | 📈 投资组合上涨 | 今日收益 +5.2%，总资产 $12,345 |
| 日跌幅超阈值 | 📉 投资组合下跌 | 今日亏损 -3.1%，总资产 $11,890 |
| 同步完成 | ✅ 数据同步完成 | Binance 同步 15 笔新交易 |
| 同步失败 | ❌ 同步失败 | Longbridge API 连接超时 |

---

## 7. 汇率 API

### 7.1 来源

| API | 用途 | 免费额度 |
|-----|------|---------|
| ExchangeRate-API | USD/CNY, USD/HKD | 1,500 次/月 |
| Open Exchange Rates | 备用 | 1,000 次/月 |

### 7.2 使用方式

```typescript
// 沿用 V1 的 useExchangeRate hook
// 实时汇率，5 分钟缓存
const CACHE_TTL = 5 * 60 * 1000;

async function getExchangeRate(from: string, to: string): Promise<number> {
  // 1. 检查缓存
  // 2. 缓存过期则请求 API
  // 3. 更新缓存并返回
}
```

---

## 8. 统一数据适配层

### 8.1 设计思路

所有交易所的原始数据格式不同，需要一个 **Adapter Layer** 统一转换为 TradeLens 内部格式：

```typescript
// lib/exchange/types.ts - 统一交易记录接口
interface NormalizedTrade {
  symbol: string;
  assetClass: 'us_stock' | 'hk_stock' | 'crypto';
  market?: string;
  exchange: 'longbridge' | 'binance' | 'bitget' | 'okx';
  side: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  quoteQuantity: number;
  commission: number;
  commissionAsset: string;
  externalTradeId: string;
  externalOrderId?: string;
  transactedAt: Date;
}

// 每个交易所实现各自的 adapter
interface ExchangeAdapter {
  name: string;
  fetchTrades(apiKey: string, params: SyncParams): Promise<NormalizedTrade[]>;
  fetchDeposits(apiKey: string): Promise<NormalizedFundFlow[]>;
  fetchWithdrawals(apiKey: string): Promise<NormalizedFundFlow[]>;
  subscribeQuote?(symbols: string[]): AsyncGenerator<QuoteUpdate>;
}
```

### 8.2 适配器实现

```
lib/exchange/
├── types.ts         # 统一类型定义
├── adapter.ts       # 适配器接口
├── longbridge.ts    # Longbridge 适配器
├── binance.ts       # Binance 适配器
├── bitget.ts        # Bitget 适配器
└── okx.ts           # OKX 适配器
```
