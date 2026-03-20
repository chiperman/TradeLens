# TradeLens - 开发任务清单 (TODO List)

## Phase 0: 项目初始化与基础设施

- [x] 初始化 Next.js 项目 (TypeScript + Tailwind CSS)
- [x] 配置环境变量模板 (`.env.example`)
- [x] 集成 UI 组件库 (shadcn/ui)
- [x] 配置 Git 规范与常用目录结构 (`/components`, `/hooks`, `/lib`, `/services`)
- [x] 编写基础布局 (Layout) 与 响应式导航栏
- [x] 集成自动化 Release 与 Changelog (standard-version)
- [x] 配置全链路 CI/CD (GitHub Actions + Dependabot)
- [x] 优化依赖管理 (PR 分组 + 自动合并)

## Phase 1: 核心计算器功能 (继承并优化 HTML 版)

- [ ] **价格实时同步模块**
  - [x] 封装 Binance 价格获取 Hook (优先使用 WebSocket)
  - [ ] 封装法币汇率获取 Hook
- [ ] **场景计算逻辑实现**
  - [x] 开发 `Calculator` 核心逻辑：覆盖买/卖双向手续费计算
  - [x] 实现 **Scenario A**: 已成交手动录入对比
  - [x] 实现 **Scenario B**: 实时价格试算与保本价 (Break-even) 动态计算
- [ ] **本地存储增强**
  - [x] 使用 `LocalStorage` 实现配置与临时计算结果的持久化

## Phase 2: 后端与数据库集成 (Supabase)

- [x] Supabase 环境搭建
  - [x] 创建 Supabase 项目并配置数据库连接
  - [x] 设计数据库 Schema:
    - [x] `calculations`: 计算历史明细
    - [ ] `users`: 用户信息
    - [ ] `api_keys`: 交易所 API Key (需要加密存储)
    - [ ] `transactions`: 交易明细流水
    - [ ] `assets_summary`: 资产汇总视图
- [ ] **用户认证系统**
  - [ ] 实现登录/注册页面
  - [ ] 集成 Supabase Auth (Email / Google)
- [x] **数据保存功能**
  - [x] 实现“保存此笔计算”到数据库历史账本

## Phase 3: 交易所 API 自动化与聚合逻辑 (核心难点)

- [ ] **Binance API 服务端集成**
  - [ ] 编写后端 API 路由用于安全调用交易所接口
  - [ ] 实现自动同步历史成交单 (Trades) 功能
- [ ] **智能聚合逻辑**
  - [ ] **基础资产映射**: 将 `BTC/USDT`, `BTC/USDC`, `BTC/FDUSD` 等记录统一映射到 `BTC` 下
  - [ ] **波段配对算法**: 自动识别买入和卖出记录并计算该次波段的盈亏率
- [ ] **状态展示**: 实时显示 API 同步进度与账户余额

## Phase 4: 桌面端开发 (Tauri)

- [ ] 初始化 Tauri 项目结构
- [ ] 配置 Tauri 窗口参数 (图标、透明度、置顶选项等)
- [ ] 适配桌面端独有功能 (如本地通知、托盘图标)
- [ ] 配置 CI/CD 自动构建 Web 与 桌面端安装包 (macOS/Windows)

## Phase 5: 数据导入/导出与看板

- [ ] **导入导出模块**
  - [ ] 实现历史账本导出为 `.xlsx` (Excel) 格式
  - [ ] 实现 `.json` 格式的完整数据备份与恢复
  - [ ] 支持按照特定模板导入 CSV 数据
- [ ] **资产可视化看板**
  - [ ] 使用 Recharts 开发盈亏统计图表 (P&L Curve)
  - [ ] 开发单币种胜率分析与盈亏贡献度饼图

## Phase 6: 优化与打磨

- [ ] 实现多语言支持 (i18n)
- [ ] 增加深色模式 (Dark Mode) 支持
- [ ] 进行性能优化：减少 API 重复请求，优化渲染列表
- [ ] 编写使用手册与 API 安全说明文档
