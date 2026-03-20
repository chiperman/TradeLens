# TradeLens 研发自动化蓝图 (The TradeLens Blueprint)

本项目旨在建立一套“高度自动化、原子化、可追溯”的现代软件研发体系。本规划定义了代码从本地开发到最终分发的全生命周期标准。

---

## 1. 核心哲学 (Core Philosophy)

*   **原子化提交 (Atomic Commits)**：每一笔提交只完成一个逻辑任务，且必须与 TODO 状态对齐。
*   **事实驱动 (Fact-Based)**：所有变更必须经过 Lint 检查、类型验证和单元测试。
*   **版本语义化 (SemVer)**：版本号严格遵循 `Major.Minor.Patch` 规范，且变更日志（Changelog）自动生成。
*   **配置即代码 (Config-as-Code)**：所有研发规则（Lint, Husky, CI/CD）均通过代码定义和追踪。

---

## 2. 研发循环 (Development Cycles)

### A. 本地开发环 (Local Loop)
*   **提交规范**：使用 `Conventional Commits`。
*   **代码守门员 (Husky)**：
    *   `pre-commit`: 运行 `lint-staged`（自动执行 `eslint` 和 `prettier`）。
    *   `commit-msg`: 运行 `commitlint` 验证标题格式。
*   **本地验证**：手动执行 `pnpm test` 确保业务逻辑（如 `calculator.ts`）正确。

### B. 持续集成 (CI Loop - GitHub Actions)
*   **触发机制**：Push 到 `main` 或发起 Pull Request。
*   **自动化流水线**：
    1.  `Dependency Check`: 验证 `pnpm-lock.yaml` 一致性。
    2.  `Static Analysis`: 运行 `pnpm lint` 和 `pnpm type-check`。
    3.  `Testing`: 运行 `vitest` 单元测试。
    4.  `Security Audit`: 使用工具扫描密钥泄露。
    5.  `Build Test`: 验证 Next.js 生产环境构建成功。

### C. 自动化发布 (Release Loop)
*   **工具栈**：`standard-version` + `.versionrc.json`。
*   **执行标准**：
    *   自动更新 `package.json` 版本。
    *   自动生成/更新 `CHANGELOG.md`。
    *   自动创建 Git Tag。
*   **触发条件**：手动触发（后期可配置为 GitHub Workflow 按钮）。

### D. 持续部署 (CD Loop)
*   **Web 分发**：Vercel 自动部署 `main` 分支。
*   **桌面端分发 (Tauri)**：
    *   CI 自动在多操作系统（macOS, Windows）环境构建安装包。
    *   自动将 Artifacts 上传至 GitHub Release 页面。

---

## 3. 盲点补全与未来演进

*   [ ] **依赖管理**：配置 `Dependabot` 定期扫描和自动升级依赖。
*   [ ] **异常监控**：生产环境集成 `Sentry` 实现错误链路追踪。
*   [ ] **数据库同步**：自动化 `Supabase Migrations` 部署流水线。
*   [ ] **预览环境**：配置 Vercel 预览部署，实现 PR 维度的 UI 验收。

---

## 4. 角色分工

*   **开发者**：负责原子化实现任务，勾选 TODO，发起提交。
*   **CI 机器人**：负责守门、跑测试、扫安全漏洞。
*   **Release 工具**：负责总结变更，分发版本。

---
*版本：v1.0.0*
*更新日期：2026-03-20*
