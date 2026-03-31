# Canvas Portal App Inventory Design

## Summary

Portal 首页从当前的 session summary 改为 app inventory。用户登录后先看到自己拥有权限的 app 列表，每个 app 卡片展示该 app 的角色、最近访问的 workbook、最近访问的 dashboard，并提供进入该 app 管理台的入口。

## Goals

- 用真实的外部授权接口返回当前用户可访问的 app 列表。
- Portal 首页按“最近访问 app 优先”展示 app 卡片。
- 进入 app 后继续沿用现有 `select-app` 和资源管理页面。
- 从 Sidebar 中移除 session summary / session context 叙事，保留管理导航。

## Non-Goals

- 不新增新的聚合分析接口。
- 不做新的 dashboard/workbook 编辑能力。
- 不改变现有 `amtoken + canvas_session` 认证主链。

## Backend Changes

### External Authorization

新增对外部接口 `GET {auth_base_url}/v1/authorization/roles` 的支持。该接口返回当前用户有权限访问的全部 app 以及每个 app 的角色列表。

### New API

新增 `GET /auth/apps`:

- 输入：`Authorization: Bearer <amtoken>`
- 输出：
  - `apps: [{ appName, roles }]`
  - `principal: { displayName, employeeId }`

该接口不依赖当前 `selectedApp`，只依赖 `amtoken`。

## Portal Session Changes

Portal session cookie 增加轻量 recent 状态：

- `recentApps: string[]`
- `recentDashboardsByApp: Record<string, string>`
- `recentWorkbooksByApp: Record<string, string>`

这些字段只存 UI 入口排序和卡片摘要所需的最小信息，不替代后端资源真值。

## Portal Overview

`/portal` 页面改为渲染 app inventory：

- 先请求可访问 app 列表
- 再按 app 并发请求 dashboard/workbook 列表
- 优先展示 recent 记录命中的资源
- 若没有 recent 记录，则回退到列表中的第一个资源

排序规则：

1. 最近访问过的 app 按最近顺序排在前面
2. 其余 app 按名称排序

## Navigation

Sidebar 保留：

- Overview
- Dashboards
- Workbooks
- Datasets

移除 Session context 入口和底部 session summary 卡片。

## Testing

- `packages/auth`: 新增外部 roles 列表接口测试
- `apps/backend`: 新增 `GET /auth/apps` 路由测试
- `apps/web`: 新增 Portal overview 排序和 app cards 测试
- `apps/web`: 新增 session route / select-app route 对 recent 记录的测试
