# TradeLens TODO List

## 🚀 High Priority (Current Phase: 7.1)

- [x] 实现 `SyncManager` 核心逻辑与 `sync_history` 数据库支持
- [x] 重构 `adapter-factory.ts` 为异步按需加载模式
- [x] 实现多用户 Cron 批量触发逻辑 (`syncAllUsers`)
- [x] 增加同步失败时的 Bark 推送告警逻辑
- [x] **[New]** 增加同步历史记录展示页面 (`SyncHistoryList`)

## ✅ Recently Completed

- [x] 完成 Phase 7.2: Longbridge 深度集成与 PWA 支持 (OAuth, Trades Sync, App Install)
- [x] 完成 Phase 7.1: 自动化同步 UI 与监控 (SyncHistory & Status Indicator)
- [x] 完成 Phase 6: 性能优化 (React.lazy)、Bark 通知集成、i18n 补全

## 📅 Upcoming (Phase 8+)

- [ ] **[Adapter]** 增加更多加密货币交易所适配器 (OKX, Bitget)
- [ ] **[Analytics]** 增强资产分析图表与多币种对比
