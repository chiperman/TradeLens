# TradeLens TODO List

## 🚀 High Priority (Current Phase: 7.1)

- [x] 实现 `SyncManager` 核心逻辑与 `sync_history` 数据库支持
- [x] 重构 `adapter-factory.ts` 为异步按需加载模式
- [x] 实现多用户 Cron 批量触发逻辑 (`syncAllUsers`)
- [x] 增加同步失败时的 Bark 推送告警逻辑
- [x] **[New]** 增加同步历史记录展示页面 (`SyncHistoryList`)

## ✅ Recently Completed

- [x] 完成 Phase 7.1: 自动化同步 UI 与监控 (SyncHistory & Status Indicator)
- [x] 完成 Phase 6: 性能优化 (React.lazy)、Bark 通知集成、i18n 补全

## 📅 Upcoming (Phase 7.2+)

- [ ] **[Adapter]** 完善 Longbridge 正式版适配器
- [ ] **[PWA]** 支持离线查看与桌面快捷方式
