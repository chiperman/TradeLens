# TradeLens v2 仓库初始化实施计划

> **给 agentic 执行者：** 必须使用子技能：优先使用 superpowers:subagent-driven-development，也可以使用 superpowers:executing-plans，按任务逐项实施本计划。步骤使用复选框（`- [ ]`）语法追踪进度。

**目标：** 创建一个干净的 TradeLens v2 orphan 分支仓库，并交付可用于生产演进的 Next.js、Supabase、Drizzle、格式化、Lint、测试和文档基础。

**架构：** 从一个与历史无关的 orphan 分支开始，确保 v2 与旧仓库内容没有提交历史关联。初始化 Next.js App Router 项目，接入 Supabase/Drizzle 基础边界，保留已确认的设计文档，并通过脚本和适合 CI 的本地命令保证质量检查可重复执行。本任务只聚焦仓库和项目基础，不实现完整的长桥/DCA 产品功能。

**技术栈：** Next.js App Router、TypeScript、Tailwind CSS、Supabase、Drizzle ORM、Vitest、Testing Library、可选 Playwright 脚手架、ESLint、Prettier、pnpm，以及面向 Vercel 的部署基础。

---

## 文件结构

本次初始化会创建或保留以下文件。

- `DESIGN.md` — 由 `npx getdesign@latest add binance` 生成的 UI 设计约束。
- `docs/superpowers/specs/2026-05-02-tradelens-mvp-design.md` — 已确认的 MVP 设计规格。
- `docs/superpowers/plans/2026-05-02-tradelens-v2-repository-bootstrap.md` — 本实施计划。
- `README.md` — 项目概览、启动方式、质量命令和部署说明。
- `.gitignore` — Node、Next.js、Supabase、环境变量和构建产物忽略规则。
- `.env.example` — 必需的前端和服务端环境变量示例，不包含密钥。
- `.nvmrc` — Node 版本锁定。
- `package.json` — 脚本、依赖和包元数据。
- `pnpm-lock.yaml` — 包安装生成的锁文件。
- `next.config.ts` — Next.js 配置。
- `tsconfig.json` — 严格 TypeScript 配置。
- `postcss.config.mjs` — Tailwind/PostCSS 配置。
- `tailwind.config.ts` — 映射到 `DESIGN.md` token 的 Tailwind 主题。
- `eslint.config.mjs` — ESLint flat config 配置。
- `.prettierrc.json` — 格式化配置。
- `vitest.config.ts` — 单元测试配置。
- `src/app/layout.tsx` — 应用根布局。
- `src/app/page.tsx` — 最小首页/看板入口。
- `src/app/globals.css` — 设计 token、默认深色模式和基础样式。
- `src/components/ui/button.tsx` — 设计系统主按钮。
- `src/components/ui/card.tsx` — 深色卡片表面组件。
- `src/components/layout/app-shell.tsx` — 后台管理布局外壳。
- `src/config/navigation.ts` — 模块导航和默认可见性。
- `src/config/i18n/zh-CN.ts` — 中文 UI 文案字典。
- `src/config/theme.ts` — 主题常量和本地存储 key。
- `src/lib/env.ts` — 服务端/客户端环境变量解析边界。
- `src/lib/supabase/client.ts` — 浏览器 Supabase client 工厂。
- `src/lib/supabase/server.ts` — 服务端 Supabase client 占位边界。
- `src/db/schema.ts` — 匹配已确认 MVP 模型的 Drizzle schema。
- `src/db/index.ts` — Drizzle 数据库入口。
- `src/integrations/longbridge/types.ts` — 标准化长桥 connector 类型。
- `src/integrations/longbridge/connector.ts` — SDK 边界桩，MVP 中禁止交易能力。
- `src/lib/portfolio/calculations.ts` — DCA 和投资组合计算 helper。
- `src/lib/portfolio/calculations.test.ts` — 计算规则单元测试。
- `src/components/ui/button.test.tsx` — 组件冒烟测试。

## 任务 1：准备干净的 orphan 分支

**文件：**

- 保留：`DESIGN.md`
- 保留：`docs/superpowers/specs/2026-05-02-tradelens-mvp-design.md`
- 保留：`docs/superpowers/plans/2026-05-02-tradelens-v2-repository-bootstrap.md`

- [ ] **步骤 1：如果缺少 Git 仓库则初始化**

运行：

```bash
git init
```

预期：仓库在 `/home/chiperman/code/TradeLens_new` 中完成初始化。

- [ ] **步骤 2：添加远程仓库**

运行：

```bash
git remote add origin git@github.com:chiperman/TradeLens.git
```

预期：`origin` 指向 `git@github.com:chiperman/TradeLens.git`。

如果 `origin` 已存在但 URL 不同，运行：

```bash
git remote set-url origin git@github.com:chiperman/TradeLens.git
```

预期：`git remote -v` 显示 fetch 和 push 都使用指定 URL。

- [ ] **步骤 3：拉取远程 refs 但不检出旧代码**

运行：

```bash
git fetch origin
```

预期：远程 refs 已在本地可用。不要 merge，也不要 checkout 旧分支。

- [ ] **步骤 4：为 v2 创建 orphan 分支**

运行：

```bash
git switch --orphan v2/bootstrap
```

预期：当前分支是 `v2/bootstrap`，且没有父提交。

- [ ] **步骤 5：确认没有关联旧历史**

运行：

```bash
git log --oneline
```

预期：输出 `fatal: your current branch 'v2/bootstrap' does not have any commits yet`。

- [ ] **步骤 6：在 orphan 工作区保留当前设计文档**

运行：

```bash
git status --short
```

预期：`DESIGN.md`、`docs/superpowers/specs/2026-05-02-tradelens-mvp-design.md` 和本计划在 orphan 分支中显示为未跟踪文件。

## 任务 2：创建 Next.js 项目脚手架

**文件：**

- 创建：`package.json`
- 创建：`pnpm-lock.yaml`
- 创建：`next.config.ts`
- 创建：`tsconfig.json`
- 创建：`postcss.config.mjs`
- 创建：`tailwind.config.ts`
- 创建：`src/app/layout.tsx`
- 创建：`src/app/page.tsx`
- 创建：`src/app/globals.css`

- [ ] **步骤 1：在当前目录创建 Next.js 应用**

运行：

```bash
pnpm create next-app@latest . --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
```

预期：Next.js 文件创建在当前目录，且不会删除 `DESIGN.md` 或 `docs/`。

如果生成器因目录非空而拒绝执行，创建临时应用并复制生成文件：

```bash
pnpm create next-app@latest /tmp/tradelens-next --ts --eslint --tailwind --app --src-dir --import-alias "@/*" --use-pnpm
cp -R /tmp/tradelens-next/. .
```

预期：生成的应用文件位于仓库根目录。

- [ ] **步骤 2：替换 `package.json` 脚本和元数据**

编辑 `package.json`，确保 scripts 包含：

```json
{
  "name": "tradelens-v2",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest run",
    "test:watch": "vitest",
    "quality": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test"
  }
}
```

在任务 3 安装额外依赖前，保留 Next.js 生成器产生的依赖版本。

- [ ] **步骤 3：锁定 Node 版本**

创建 `.nvmrc`：

```text
22
```

预期：贡献者和部署环境都可以使用 Node 22。

- [ ] **步骤 4：创建初始应用布局**

将 `src/app/layout.tsx` 替换为：

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeLens",
  description: "个人投资账户与定投分析看板",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **步骤 5：创建初始看板入口**

将 `src/app/page.tsx` 替换为：

```tsx
import { AppShell } from "@/components/layout/app-shell";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm text-muted">TradeLens v2</p>
          <h1 className="mt-2 text-3xl font-semibold text-body">投资账户总览</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-strong">
            MVP 将优先接入长桥股票账户，并支持 BTC/ETH 定投记录与盈亏追踪。
          </p>
        </div>
      </section>
    </AppShell>
  );
}
```

这里依赖 `AppShell`，它会在任务 5 中创建。

## 任务 3：安装项目依赖

**文件：**

- 修改：`package.json`
- 修改：`pnpm-lock.yaml`

- [ ] **步骤 1：安装运行时依赖**

运行：

```bash
pnpm add @supabase/ssr @supabase/supabase-js drizzle-orm postgres zod lucide-react next-themes clsx tailwind-merge
```

预期：依赖被添加到 `package.json` 和 `pnpm-lock.yaml`。

- [ ] **步骤 2：安装开发依赖**

运行：

```bash
pnpm add -D drizzle-kit prettier vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

预期：开发依赖已添加。

- [ ] **步骤 3：验证依赖安装**

运行：

```bash
pnpm install --frozen-lockfile
```

预期：安装完成，且不会修改锁文件。

## 任务 4：添加格式化、Lint 和测试配置

**文件：**

- 创建：`.prettierrc.json`
- 创建：`vitest.config.ts`
- 修改：`eslint.config.mjs`
- 修改：`tsconfig.json`

- [ ] **步骤 1：添加 Prettier 配置**

创建 `.prettierrc.json`：

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **步骤 2：添加 Vitest 配置**

创建 `vitest.config.ts`：

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **步骤 3：添加测试初始化文件**

创建 `src/test/setup.ts`：

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **步骤 4：确保 TypeScript 启用严格检查**

编辑 `tsconfig.json`，确保 `compilerOptions` 包含：

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true
}
```

保留其他由 Next.js 生成的 compiler options。

- [ ] **步骤 5：运行基础质量检查**

运行：

```bash
pnpm quality
```

预期：在任务 5 的组件添加前，这一步可能失败。记录失败原因并继续。

## 任务 5：添加设计 token 和布局组件

**文件：**

- 修改：`tailwind.config.ts`
- 修改：`src/app/globals.css`
- 创建：`src/config/navigation.ts`
- 创建：`src/config/i18n/zh-CN.ts`
- 创建：`src/config/theme.ts`
- 创建：`src/components/ui/button.tsx`
- 创建：`src/components/ui/card.tsx`
- 创建：`src/components/layout/app-shell.tsx`
- 创建：`src/components/ui/button.test.tsx`

- [ ] **步骤 1：根据 `DESIGN.md` 配置 Tailwind token**

将 `tailwind.config.ts` 替换为：

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#fcd535",
        "primary-active": "#f0b90b",
        "primary-disabled": "#3a3a1f",
        ink: "#181a20",
        body: "#eaecef",
        "body-on-light": "#181a20",
        muted: "#707a8a",
        "muted-strong": "#929aa5",
        "hairline-on-light": "#eaecef",
        "hairline-on-dark": "#2b3139",
        "border-strong": "#cdd1d6",
        "canvas-light": "#ffffff",
        "canvas-dark": "#0b0e11",
        "surface-card-dark": "#1e2329",
        "surface-elevated-dark": "#2b3139",
        "surface-soft-light": "#fafafa",
        "surface-strong-light": "#f5f5f5",
        "on-primary": "#181a20",
        "on-dark": "#ffffff",
        "trading-up": "#0ecb81",
        "trading-down": "#f6465d",
        info: "#3b82f6",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        number: ["IBM Plex Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **步骤 2：添加全局样式**

将 `src/app/globals.css` 替换为：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
  background: #0b0e11;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: #0b0e11;
  color: #eaecef;
}

button,
input,
textarea,
select {
  font: inherit;
}
```

- [ ] **步骤 3：添加导航配置**

创建 `src/config/navigation.ts`：

```ts
export type NavigationItem = {
  key: "dashboard" | "stocks" | "crypto" | "dca" | "analytics" | "integrations" | "settings";
  label: string;
  href: string;
  defaultVisible: boolean;
};

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "总览", href: "/", defaultVisible: true },
  { key: "stocks", label: "股票", href: "/stocks", defaultVisible: true },
  { key: "crypto", label: "Crypto", href: "/crypto", defaultVisible: false },
  { key: "dca", label: "定投", href: "/dca", defaultVisible: true },
  { key: "analytics", label: "分析", href: "/analytics", defaultVisible: false },
  { key: "integrations", label: "集成", href: "/integrations", defaultVisible: true },
  { key: "settings", label: "设置", href: "/settings", defaultVisible: true },
];
```

- [ ] **步骤 4：添加中文文案字典**

创建 `src/config/i18n/zh-CN.ts`：

```ts
export const zhCN = {
  appName: "TradeLens",
  dashboard: {
    title: "投资账户总览",
    subtitle: "连接长桥账户，追踪股票资产与 BTC/ETH 定投盈亏。",
  },
  actions: {
    syncLongbridge: "同步长桥",
    addDcaEntry: "录入定投",
    manageIntegrations: "管理集成",
  },
} as const;
```

- [ ] **步骤 5：添加主题常量**

创建 `src/config/theme.ts`：

```ts
export const themeConfig = {
  defaultTheme: "dark",
  storageKey: "tradelens-theme",
} as const;
```

- [ ] **步骤 6：添加按钮组件**

创建 `src/components/ui/button.tsx`：

```tsx
import { type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active focus:outline-none focus:ring-2 focus:ring-info/50 disabled:bg-primary-disabled disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **步骤 7：添加卡片组件**

创建 `src/components/ui/card.tsx`：

```tsx
import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-body",
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **步骤 8：添加应用外壳**

创建 `src/components/layout/app-shell.tsx`：

```tsx
import Link from "next/link";
import { navigationItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const visibleItems = navigationItems.filter((item) => item.defaultVisible);

  return (
    <main className="min-h-screen bg-canvas-dark text-body">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-hairline-on-dark bg-canvas-dark p-6 lg:block">
        <Link href="/" className="text-xl font-semibold text-primary">
          TradeLens
        </Link>
        <nav className="mt-8 grid gap-2">
          {visibleItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-strong hover:bg-surface-card-dark hover:text-body"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-hairline-on-dark px-6">
          <span className="text-sm text-muted">默认 USD · 可切换 CNY</span>
          <Button>同步长桥</Button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </main>
  );
}
```

- [ ] **步骤 9：添加按钮冒烟测试**

创建 `src/components/ui/button.test.tsx`：

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders a primary action", () => {
    render(<Button>同步长桥</Button>);

    expect(screen.getByRole("button", { name: "同步长桥" })).toBeInTheDocument();
  });
});
```

- [ ] **步骤 10：验证 UI 基础**

运行：

```bash
pnpm test src/components/ui/button.test.tsx
```

预期：测试通过。

## 任务 6：添加环境变量和 Supabase 边界

**文件：**

- 创建：`.env.example`
- 创建：`src/lib/env.ts`
- 创建：`src/lib/supabase/client.ts`
- 创建：`src/lib/supabase/server.ts`

- [ ] **步骤 1：添加 `.env.example`**

创建 `.env.example`：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
LONGPORT_APP_KEY=
LONGPORT_APP_SECRET=
LONGPORT_ACCESS_TOKEN=
CREDENTIAL_ENCRYPTION_KEY=
```

- [ ] **步骤 2：添加环境变量解析器**

创建 `src/lib/env.ts`：

```ts
import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = clientEnvSchema.extend({
  DATABASE_URL: z.string().min(1),
  LONGPORT_APP_KEY: z.string().optional(),
  LONGPORT_APP_SECRET: z.string().optional(),
  LONGPORT_ACCESS_TOKEN: z.string().optional(),
  CREDENTIAL_ENCRYPTION_KEY: z.string().optional(),
});

export function getClientEnv() {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv() {
  return serverEnvSchema.parse(process.env);
}
```

- [ ] **步骤 3：添加浏览器 Supabase client**

创建 `src/lib/supabase/client.ts`：

```ts
import { createBrowserClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";

export function createClient() {
  const env = getClientEnv();

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
```

- [ ] **步骤 4：添加服务端 Supabase 边界**

创建 `src/lib/supabase/server.ts`：

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getClientEnv } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();
  const env = getClientEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}
```

- [ ] **步骤 5：对环境变量和 Supabase 文件执行类型检查**

运行：

```bash
pnpm typecheck
```

预期：TypeScript 通过；如果失败，只应来自后续任务尚未添加的文件。继续前修复所有 import/type 错误。

## 任务 7：添加 Drizzle Schema

**文件：**

- 创建：`drizzle.config.ts`
- 创建：`src/db/schema.ts`
- 创建：`src/db/index.ts`

- [ ] **步骤 1：添加 Drizzle 配置**

创建 `drizzle.config.ts`：

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
```

- [ ] **步骤 2：添加数据库 schema**

创建 `src/db/schema.ts`：

```ts
import { relations } from "drizzle-orm";
import { index, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const providerEnum = pgEnum("provider", ["longbridge", "binance", "okx", "bitget"]);
export const connectionStatusEnum = pgEnum("connection_status", [
  "not_configured",
  "connected",
  "error",
]);
export const syncStatusEnum = pgEnum("sync_status", ["never", "success", "partial", "failed"]);
export const assetTypeEnum = pgEnum("asset_type", ["stock", "crypto", "cash", "fund"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "buy",
  "sell",
  "dividend",
  "fee",
  "deposit",
  "withdrawal",
  "cash_flow",
]);
export const dcaEntryTypeEnum = pgEnum("dca_entry_type", ["buy", "sell"]);
export const dcaPlanStatusEnum = pgEnum("dca_plan_status", ["active", "archived"]);

export const brokerConnections = pgTable(
  "broker_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    provider: providerEnum("provider").notNull(),
    displayName: text("display_name").notNull(),
    status: connectionStatusEnum("status").notNull().default("not_configured"),
    encryptedCredentials: text("encrypted_credentials"),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    lastSyncStatus: syncStatusEnum("last_sync_status").notNull().default("never"),
    lastSyncError: text("last_sync_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userProviderIdx: index("broker_connections_user_provider_idx").on(table.userId, table.provider),
  }),
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    brokerConnectionId: uuid("broker_connection_id").references(() => brokerConnections.id),
    provider: providerEnum("provider").notNull(),
    accountType: text("account_type").notNull(),
    displayName: text("display_name").notNull(),
    baseCurrency: text("base_currency").notNull().default("USD"),
    externalAccountRef: text("external_account_ref"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("accounts_user_idx").on(table.userId),
  }),
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetType: assetTypeEnum("asset_type").notNull(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    market: text("market"),
    currency: text("currency").notNull(),
    providerMetadata: jsonb("provider_metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    symbolIdx: index("assets_symbol_idx").on(table.symbol),
  }),
);

export const positions = pgTable(
  "positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    quantity: numeric("quantity", { precision: 28, scale: 10 }).notNull(),
    availableQuantity: numeric("available_quantity", { precision: 28, scale: 10 }),
    averageCost: numeric("average_cost", { precision: 28, scale: 10 }),
    marketPrice: numeric("market_price", { precision: 28, scale: 10 }),
    marketValue: numeric("market_value", { precision: 28, scale: 10 }),
    unrealizedPnl: numeric("unrealized_pnl", { precision: 28, scale: 10 }),
    currency: text("currency").notNull(),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userAccountIdx: index("positions_user_account_idx").on(table.userId, table.accountId),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id").references(() => accounts.id),
    assetId: uuid("asset_id").references(() => assets.id),
    source: text("source").notNull(),
    externalId: text("external_id"),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    side: text("side"),
    quantity: numeric("quantity", { precision: 28, scale: 10 }),
    price: numeric("price", { precision: 28, scale: 10 }),
    grossAmount: numeric("gross_amount", { precision: 28, scale: 10 }),
    feeAmount: numeric("fee_amount", { precision: 28, scale: 10 }),
    currency: text("currency").notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userExecutedIdx: index("transactions_user_executed_idx").on(table.userId, table.executedAt),
  }),
);

export const valuationSnapshots = pgTable(
  "valuation_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    accountId: uuid("account_id").references(() => accounts.id),
    snapshotAt: timestamp("snapshot_at", { withTimezone: true }).notNull(),
    cashValue: numeric("cash_value", { precision: 28, scale: 10 }).notNull(),
    positionsValue: numeric("positions_value", { precision: 28, scale: 10 }).notNull(),
    netAssets: numeric("net_assets", { precision: 28, scale: 10 }).notNull(),
    baseCurrency: text("base_currency").notNull().default("USD"),
    displayValueUsd: numeric("display_value_usd", { precision: 28, scale: 10 }),
    displayValueCny: numeric("display_value_cny", { precision: 28, scale: 10 }),
    rawPayload: jsonb("raw_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userSnapshotIdx: index("valuation_snapshots_user_snapshot_idx").on(
      table.userId,
      table.snapshotAt,
    ),
  }),
);

export const dcaPlans = pgTable("dca_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  assetId: uuid("asset_id")
    .notNull()
    .references(() => assets.id),
  name: text("name").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  status: dcaPlanStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const dcaEntries = pgTable(
  "dca_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    dcaPlanId: uuid("dca_plan_id")
      .notNull()
      .references(() => dcaPlans.id),
    entryType: dcaEntryTypeEnum("entry_type").notNull(),
    quantity: numeric("quantity", { precision: 28, scale: 10 }).notNull(),
    price: numeric("price", { precision: 28, scale: 10 }).notNull(),
    feeAmount: numeric("fee_amount", { precision: 28, scale: 10 }).notNull().default("0"),
    currency: text("currency").notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userExecutedIdx: index("dca_entries_user_executed_idx").on(table.userId, table.executedAt),
  }),
);

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  baseCurrency: text("base_currency").notNull().default("USD"),
  visibleModules: jsonb("visible_modules").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const brokerConnectionsRelations = relations(brokerConnections, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  brokerConnection: one(brokerConnections, {
    fields: [accounts.brokerConnectionId],
    references: [brokerConnections.id],
  }),
  positions: many(positions),
  transactions: many(transactions),
}));
```

- [ ] **步骤 3：添加数据库 client**

创建 `src/db/index.ts`：

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getServerEnv } from "@/lib/env";
import * as schema from "./schema";

const env = getServerEnv();
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
```

- [ ] **步骤 4：生成初始 migration**

运行：

```bash
pnpm drizzle-kit generate
```

预期：SQL migration 生成在 `supabase/migrations` 中。

- [ ] **步骤 5：对 schema 执行类型检查**

运行：

```bash
pnpm typecheck
```

预期：TypeScript 通过。

## 任务 8：添加长桥边界桩

**文件：**

- 创建：`src/integrations/longbridge/types.ts`
- 创建：`src/integrations/longbridge/connector.ts`

- [ ] **步骤 1：添加标准化 connector 类型**

创建 `src/integrations/longbridge/types.ts`：

```ts
export type NormalizedLongbridgeAccount = {
  netAssets: string;
  totalCash: string;
  buyPower: string;
  currency: string;
  raw: unknown;
};

export type NormalizedLongbridgePosition = {
  symbol: string;
  name: string;
  market: string;
  quantity: string;
  availableQuantity: string;
  costPrice: string;
  currency: string;
  raw: unknown;
};

export type NormalizedLongbridgeExecution = {
  externalId: string;
  orderId: string;
  symbol: string;
  quantity: string;
  price: string;
  executedAt: Date;
  raw: unknown;
};

export type LongbridgeSyncPayload = {
  accountBalances: NormalizedLongbridgeAccount[];
  positions: NormalizedLongbridgePosition[];
  executions: NormalizedLongbridgeExecution[];
};
```

- [ ] **步骤 2：添加禁止交易的 connector 桩**

创建 `src/integrations/longbridge/connector.ts`：

```ts
import type { LongbridgeSyncPayload } from "./types";

export class LongbridgeConnector {
  async syncReadOnly(): Promise<LongbridgeSyncPayload> {
    return {
      accountBalances: [],
      positions: [],
      executions: [],
    };
  }

  submitOrder(): never {
    throw new Error("TradeLens MVP is read-only and does not support order submission.");
  }

  cancelOrder(): never {
    throw new Error("TradeLens MVP is read-only and does not support order cancellation.");
  }
}
```

- [ ] **步骤 3：对 connector 边界执行类型检查**

运行：

```bash
pnpm typecheck
```

预期：TypeScript 通过。

## 任务 9：添加投资组合计算测试和 helper

**文件：**

- 创建：`src/lib/portfolio/calculations.ts`
- 创建：`src/lib/portfolio/calculations.test.ts`

- [ ] **步骤 1：编写计算测试**

创建 `src/lib/portfolio/calculations.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { calculateDcaSummary } from "./calculations";

describe("calculateDcaSummary", () => {
  it("tracks remaining cost and current pnl after partial sells", () => {
    const summary = calculateDcaSummary({
      currentPrice: 50000,
      entries: [
        { type: "buy", quantity: 0.1, price: 40000, fee: 2 },
        { type: "buy", quantity: 0.1, price: 60000, fee: 2 },
        { type: "sell", quantity: 0.05, price: 70000, fee: 3 },
      ],
    });

    expect(summary.totalQuantity).toBeCloseTo(0.15);
    expect(summary.cumulativeInput).toBeCloseTo(10004);
    expect(summary.recoveredPrincipal).toBeCloseTo(3497);
    expect(summary.remainingCost).toBeCloseTo(6507);
    expect(summary.currentValue).toBeCloseTo(7500);
    expect(summary.currentPnl).toBeCloseTo(993);
  });
});
```

- [ ] **步骤 2：运行测试确认失败**

运行：

```bash
pnpm test src/lib/portfolio/calculations.test.ts
```

预期：失败，因为 `./calculations` 尚不存在。

- [ ] **步骤 3：实现计算 helper**

创建 `src/lib/portfolio/calculations.ts`：

```ts
export type DcaEntryInput = {
  type: "buy" | "sell";
  quantity: number;
  price: number;
  fee: number;
};

export type DcaSummaryInput = {
  currentPrice: number;
  entries: DcaEntryInput[];
};

export type DcaSummary = {
  totalQuantity: number;
  cumulativeInput: number;
  recoveredPrincipal: number;
  remainingCost: number;
  currentValue: number;
  currentPnl: number;
};

export function calculateDcaSummary(input: DcaSummaryInput): DcaSummary {
  const cumulativeInput = input.entries
    .filter((entry) => entry.type === "buy")
    .reduce((total, entry) => total + entry.quantity * entry.price + entry.fee, 0);

  const recoveredPrincipal = input.entries
    .filter((entry) => entry.type === "sell")
    .reduce((total, entry) => total + entry.quantity * entry.price - entry.fee, 0);

  const totalQuantity = input.entries.reduce((total, entry) => {
    return entry.type === "buy" ? total + entry.quantity : total - entry.quantity;
  }, 0);

  const remainingCost = cumulativeInput - recoveredPrincipal;
  const currentValue = totalQuantity * input.currentPrice;
  const currentPnl = currentValue + recoveredPrincipal - cumulativeInput;

  return {
    totalQuantity,
    cumulativeInput,
    recoveredPrincipal,
    remainingCost,
    currentValue,
    currentPnl,
  };
}
```

- [ ] **步骤 4：运行测试确认通过**

运行：

```bash
pnpm test src/lib/portfolio/calculations.test.ts
```

预期：通过。

## 任务 10：添加 README 和忽略规则

**文件：**

- 创建或修改：`README.md`
- 创建或修改：`.gitignore`

- [ ] **步骤 1：添加 README**

创建 `README.md`：

````md
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
````

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
pnpm drizzle-kit generate
```

Migration 会写入 `supabase/migrations`。

## 文档

- UI 参考：`DESIGN.md`
- MVP 设计规格：`docs/superpowers/specs/2026-05-02-tradelens-mvp-design.md`
- 初始化计划：`docs/superpowers/plans/2026-05-02-tradelens-v2-repository-bootstrap.md`

## 安全约束

MVP 对长桥保持只读。不得暴露 SDK 的交易方法，例如提交订单或撤单。

````

- [ ] **步骤 2：添加忽略规则**

创建 `.gitignore`：

```gitignore
node_modules
.next
out
.vercel
.env
.env.local
.env.*.local
.DS_Store
coverage
playwright-report
test-results
*.tsbuildinfo
````

## 任务 11：运行完整校验

**文件：**

- 校验所有项目文件。

- [ ] **步骤 1：格式化文件**

运行：

```bash
pnpm format
```

预期：Prettier 会格式化源码和 Markdown 文件。

- [ ] **步骤 2：运行完整质量命令**

运行：

```bash
pnpm quality
```

预期：format check、lint、typecheck 和测试全部通过。

- [ ] **步骤 3：构建生产应用**

运行：

```bash
pnpm build
```

预期：Next.js 生产构建通过。

## 任务 12：提交并推送 v2 初始化分支

**文件：**

- 提交本次初始化创建的所有文件。

- [ ] **步骤 1：检查工作区**

运行：

```bash
git status --short
```

预期：只列出预期的项目文件。

- [ ] **步骤 2：提交前检查 diff 统计**

运行：

```bash
git diff --stat
```

预期：包含项目初始化、文档、配置和源码文件。

- [ ] **步骤 3：暂存目标文件**

运行：

```bash
git add .gitignore .nvmrc .prettierrc.json DESIGN.md README.md docs package.json pnpm-lock.yaml next.config.ts tsconfig.json postcss.config.mjs tailwind.config.ts eslint.config.mjs vitest.config.ts drizzle.config.ts src supabase .env.example
```

预期：目标初始化文件已暂存。如果某个路径不存在，从命令中移除该路径，并仅用已存在路径重新运行。

- [ ] **步骤 4：提交初始化内容**

运行：

```bash
git commit -m "chore: bootstrap tradelens v2" -m "Create a history-independent v2 foundation with Next.js, Supabase, Drizzle, design docs, quality checks, and the initial read-only Longbridge boundary."
```

预期：创建 orphan 分支上的第一个提交。

- [ ] **步骤 5：推送 orphan 分支到远程**

运行：

```bash
git push -u origin v2/bootstrap
```

预期：`v2/bootstrap` 已在 `git@github.com:chiperman/TradeLens.git` 可用，且不与旧分支共享历史。

- [ ] **步骤 6：提交后验证 orphan 历史**

运行：

```bash
git log --oneline --max-count=5
```

预期：只显示新的初始化提交；除非之后有意在其上追加提交。

## 自检

- 规格覆盖：本计划覆盖文档、Next.js、Supabase、Drizzle、来自 `DESIGN.md` 的默认深色设计 token、本地主题常量、i18n 结构、导航默认可见性、长桥只读边界、DCA 计算规则、校验脚本和 orphan 分支流程。
- 有意延后：完整认证页面、真实长桥 SDK 调用、加密凭证存储、图表和 CRUD 页面不会在本次初始化中实现，它们属于后续产品实施计划。
- 占位符扫描：没有遗留 `TBD`、`TODO` 或未定义的未来任务引用。
- 类型一致性：各任务中的文件路径、导出名称和 import 保持一致。
