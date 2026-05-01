# TradeLens v2

TradeLens v2 是一个个人优先的投资看板。MVP 会连接长桥股票账户，追踪投资组合价值与盈亏，并支持手动记录 BTC/ETH 定投。

## 技术栈

- Next.js App Router
- TypeScript
- Supabase Auth and Postgres
- Drizzle ORM
- Tailwind CSS
- Vitest and Testing Library
- Vercel deployment target

## 本地启动

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

使用集成功能前，需要在 `.env.local` 中填写 Supabase 和长桥凭证。

## 质量检查

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm quality
```

## 数据库

```bash
pnpm db:generate
```

Migration 会写入 `supabase/migrations`。

## 文档

- UI 参考：`DESIGN.md`
- MVP 设计规格：`docs/superpowers/specs/2026-05-02-tradelens-mvp-design.md`
- 初始化计划：`docs/superpowers/plans/2026-05-02-tradelens-v2-repository-bootstrap.md`

## 安全约束

MVP 对长桥保持只读。不得暴露 SDK 的交易方法，例如提交订单或撤单。
