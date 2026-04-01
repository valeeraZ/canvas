# Canvas Dashboard Editor Chart Design

## Summary

Portal 中的 dashboard detail 页将从占位 Overview 升级为真正的 dashboard editor。用户先上传 CSV 或 `.xlsx` dataset，再在某个 dashboard 内添加多个 chart widgets，选择 dataset、chart type、x axis、y axis 与可选 series，并立即在 dashboard canvas 中渲染 chart。

第一版以 shadcn chart 生态中的基础图表为起点，优先支持 `bar`、`line`、`area`、`pie`。实现方式要为后续扩展到更多 shadcn chart 类型保留统一的 chart spec 和 rendering adapter。

## Goals

- 支持一个 dashboard 内存在多个 widgets，并在 Portal 的 `Overview` tab 中渲染它们。
- 将上传后的 dataset 归一化为统一 records 结构，供 chart widgets 配置和渲染复用。
- 支持 chart widget 的最小配置闭环：
  - `dataset`
  - `chart type`
  - `x axis`
  - `y axis`
  - `series`
- 将 widget 配置持久化到现有 `DashboardWidget` 模型。
- 用 shadcn chart 风格组件在 dashboard canvas 中真实渲染 widget。

## Non-Goals

- 第一版不实现完整自由拖拽布局。
- 第一版不同时做 `table`、`metric`、`text` 等非 chart widget 的完整编辑能力。
- 第一版不做复杂 query builder，也不引入独立语义层或 warehouse。
- 第一版不追求覆盖全部 shadcn chart，只要求架构可扩展到全部 chart。

## Editor Experience

Dashboard detail 页继续保留三个 tabs：

- `Overview`
- `Sharing`
- `Import / Export`

其中：

- `Overview` 升级为 editor workspace
- `Sharing` 继续承载 visibility / share subjects
- `Import / Export` 继续承载 dashboard portability

`Overview` 的布局改为三块：

1. `Widgets`
   - 列出现有 widgets
   - `Add chart` 按钮
   - 选中某个 widget 进入配置态
2. `Canvas`
   - 网格或列表形式展示多个 widget
   - 已配置 widget 直接渲染 chart
   - 未配置 widget 显示 empty / incomplete state
3. `Configure widget`
   - 仅在选中 widget 后显示
   - 用 shadcn form controls 配置 dataset 和 chart axes

`Select for embed` 继续保留在页面顶部的小按钮，不进入 editor 主区。

## Data Normalization

Dataset 在 upload / ingest 后，需要为 editor 暴露一份轻量预览与 normalized records。

第一版采用单一主格式：

```ts
type NormalizedRecord = Record<string, string | number | boolean | null>;
```

例如：

```ts
[
  { month: "Jan", revenue: 120, region: "APAC" },
  { month: "Feb", revenue: 150, region: "APAC" }
]
```

同时暴露列元数据：

```ts
type DatasetColumn = {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "unknown";
};
```

第一版只需要：

- sample rows
- normalized records
- inferred columns

这些信息可以先以 JSON 形式保存在 dataset 相关存储中，而不是引入新分析存储层。

## Widget Model

沿用现有 `DashboardWidget` 模型，把 `config` 字段升级为真正的 chart spec 持久化载体。

第一版 chart widget config 统一为：

```ts
type ChartWidgetConfig = {
  datasetId: string;
  chartType: "bar" | "line" | "area" | "pie";
  xField: string;
  yField: string;
  seriesField?: string;
  title?: string;
};
```

Widget 记录的最低要求：

- `type = "chart"`
- `datasetId`
- `config`

这样一个 dashboard 中的多个 widgets 可以独立绑定 dataset 和 chart spec。

## Chart Rendering

前端新增一层 chart rendering adapter，把 normalized records + `ChartWidgetConfig` 转换成 shadcn chart 组件需要的 props。

第一版目标：

- `bar`
- `line`
- `area`
- `pie`

设计要求：

- chart type 与 renderer 解耦
- 新增 chart type 时不需要改 editor 主壳
- axis selection 和 chart rendering 共用同一份 config

这层 adapter 是后续扩展到更多 shadcn charts 的关键边界。

## Backend Changes

### Dataset Preview APIs

现有 dataset resource 需要新增或扩展“可用于编辑器配置”的 preview / schema 数据：

- dataset 列信息
- sample rows
- normalized records

第一版可先通过 dataset detail 或专门的 dataset preview 接口暴露。

### Dashboard Widget APIs

需要新增或扩展 dashboard widget 读写接口，使 Portal editor 能：

- 列出当前 dashboard 的 widgets
- 新建 chart widget
- 更新 chart widget config

第一版操作粒度建议为：

- `GET /dashboards/:dashboardId/widgets`
- `POST /dashboards/:dashboardId/widgets`
- `PATCH /dashboards/:dashboardId/widgets/:widgetId`

后端继续复用 app-scoped auth 与 `selectedApp` 上下文。

## Frontend Changes

Portal 前端新增以下职责：

- 在 dashboard detail 的 `Overview` 内渲染 editor shell
- 管理当前 dashboard 的 widget list 和 active widget
- 加载 dataset previews
- 在配置变更后即时更新 widget chart

建议拆分为：

- `dashboard-canvas`
- `dashboard-widget-list`
- `dashboard-widget-config-panel`
- `dashboard-chart-renderer`

避免继续把所有 editor 逻辑塞进当前单一 `dashboard-editor.tsx`。

## Error Handling

- 所有 editor 写操作继续沿用现有安全错误策略：
  - 对用户只展示通用失败提示
  - 展示 `Request ID`
  - 不暴露底层 Prisma / stack / SQL 信息
- dataset preview 为空或字段不足时，widget config panel 要给出清晰 empty state。
- chart spec 不完整时，canvas 中显示“待配置”占位，而不是直接渲染失败。

## Testing

- `packages/db`
  - widget persistence helper tests
  - dataset normalization / preview helper tests
- `apps/backend`
  - dashboard widget routes tests
  - dataset preview route tests
- `apps/web`
  - editor shell tests
  - widget config panel tests
  - chart renderer tests
  - dashboard detail page integration tests

## Rollout Shape

推荐按两个阶段落地：

1. `multiple chart widgets + normalized dataset preview + chart rendering`
2. 在同一套 widget/config/renderer 边界上继续扩展更多 shadcn charts 与后续 widget types
