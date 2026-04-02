# Canvas Dataset S3 Upload Design

## Summary

Canvas 需要把当前“粘贴 CSV 内容创建 dataset”的临时方案，升级为真正的文件上传基础设施。新方案要求浏览器上传完整文件到 Canvas backend，由 backend 以流式方式接收请求体，并在服务端拆分为 multipart parts 上传到 S3-compatible object storage。

这一版目标是支持最大约 `1GB` 的 dataset 文件，并把 dataset 记录扩展为真正可管理的资产：不仅知道文件存在哪里，还知道是谁上传的、什么时候上传的、当前导入状态是什么、以及它被哪些 dashboard / widget 使用。

## Goals

- 支持浏览器选择真实文件上传，而不是要求用户粘贴文件内容。
- 支持 backend 将大文件以流式方式拆分并执行 S3 multipart upload。
- 将 object storage 配置完全收敛到 backend 环境变量中管理。
- 为 dataset 增加系统元数据字段：
  - 上传者
  - 文件名
  - 内容类型
  - 文件大小
  - S3 bucket / object key / upload id
  - 导入状态
- 为 Portal dataset 视图增加 usage metadata，展示 dataset 被哪些 dashboard / widget / workbook 使用。
- 保持后续 dashboard editor 可以继续消费 dataset preview。

## Non-Goals

- 第一版不做浏览器直传 S3，也不做 presigned multipart 给浏览器直接上传。
- 第一版不做 dataset ACL / share model。
- 第一版不做真正的断点续传恢复。
- 第一版不做多对象版本管理或生命周期策略。
- 第一版不要求 `.xls` 全量支持；优先保证 `.csv` 与 `.xlsx` 上传链路可落地。

## Upload Architecture

新链路采用“浏览器整文件上传到 backend，backend 再 multipart 上传 S3”的模式。

### Flow

1. 浏览器调用 `POST /datasets/uploads`
   - backend 创建：
     - dataset record
     - import job
     - upload session record
   - 返回：
     - `uploadId`
     - `datasetId`
     - 文件上传 endpoint
     - 当前 dataset metadata

2. 浏览器将完整文件上传到 `PUT /datasets/uploads/:uploadId/file`
   - backend 流式读取请求体
   - 按固定 `partSize` 切块
   - 调用 object storage multipart API：
     - create multipart upload
     - upload part
     - complete multipart upload

3. backend 完成 multipart upload 后：
   - 更新 dataset 的 object storage metadata
   - 更新 import job 状态
   - 返回最终上传结果

4. 后续 ingest / worker 从 S3 读取对象，生成 preview、warnings、导入结果

### Why This Shape

- 前端实现比浏览器自己做 chunk 编排更简单。
- backend 不需要把整文件完整落盘或一次性读入内存。
- multipart upload 可以更稳地处理 1GB 级文件。
- object storage 细节只在 backend 内部可见，更利于权限和配置管理。

## Backend Modules

建议把上传逻辑拆成 4 个清晰边界：

### 1. Upload Session Service

负责：
- 创建 upload session
- 关联 dataset / import job
- 追踪当前上传状态

建议新增字段：
- `id`
- `datasetId`
- `tenantId`
- `status`
- `sourceFilename`
- `contentType`
- `sizeBytes`
- `storageUploadId`
- `storageBucket`
- `storageObjectKey`
- `uploadedByExternalUserId`
- `uploadedByDisplayName`

### 2. Storage Upload Service

负责：
- 读取 backend env
- 创建 S3 client
- 发起 multipart upload
- upload part
- complete / abort multipart upload

这层不关心 dataset 业务语义，只关心 object storage。

### 3. Dataset Metadata Service

负责持久化 dataset 一等字段：
- `uploadedByExternalUserId`
- `uploadedByDisplayName`
- `uploadedAt`
- `sourceFilename`
- `contentType`
- `sizeBytes`
- `storageBucket`
- `storageObjectKey`
- `storageUploadId`
- `importStatus`

### 4. Dataset Usage Projection

这层不要求单独存一份静态 metadata，而是尽量从现有关系推导：
- `usedByDashboards`
- `usedByWidgets`
- `usedByWorkbooks`

推荐从 `DashboardWidget.datasetId` 和 `Dashboard.workbookId` 关系派生 usage summary。

## Environment Variables

S3 / object storage 配置全部由 backend 从 env 读取。

建议放入 `/Users/sylvain/Work/canvas/apps/backend/.env.example`：

- `S3_ENDPOINT`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_BUCKET`
- `S3_FORCE_PATH_STYLE`

行为约束：
- backend route / service 不直接硬编码 bucket
- `packages/storage` 读取并封装 storage config
- 本地与部署环境仅通过 env 替换

## API Shape

### `POST /datasets/uploads`

用途：
- 创建 dataset upload session

请求：
- `filename`
- `contentType`
- `sizeBytes`
- `name`

响应：
- `uploadId`
- `dataset`
- `upload`
  - `bucket`
  - `objectKey`
  - `uploadUrl`

### `PUT /datasets/uploads/:uploadId/file`

用途：
- 上传完整文件到 backend

行为：
- backend 流式读取请求体
- server-side multipart upload to S3
- 成功后更新 dataset/import job 状态

响应：
- `dataset`
- `importJob`
- `storage`
  - `bucket`
  - `objectKey`

### `POST /datasets/uploads/:uploadId/abort`

用途：
- 中止 multipart upload 并清理 session

### `GET /datasets/:datasetId`

扩展返回：
- dataset 系统元数据
- usage summary

### `GET /datasets/:datasetId/preview`

继续保留：
- columns
- sample rows
- records

这条接口仍服务于 dashboard editor。

## Portal UX

Portal 的 dataset 页面将从“Paste CSV content”切换为真实文件上传：

- 使用文件选择器
- 展示当前选中文件：
  - 文件名
  - 类型
  - 大小
- 上传中显示进度
- 失败时显示通用错误提示 + `Request ID`
- 成功后刷新 dataset inventory

dataset inventory / detail 将额外展示：
- uploaded by
- uploaded at
- filename / size / type
- import status
- used by dashboards / widgets / workbooks

## Metadata Model

### Stored System Metadata

这些字段应该作为 dataset 一等信息落库：

- `uploadedByExternalUserId`
- `uploadedByDisplayName`
- `uploadedAt`
- `sourceFilename`
- `contentType`
- `sizeBytes`
- `storageBucket`
- `storageObjectKey`
- `storageUploadId`
- `importStatus`

### Derived Usage Metadata

这部分优先从关系推导，而不是手工重复写入：

- `usedByDashboards`
- `usedByWidgets`
- `usedByWorkbooks`

这样可以避免 usage 信息和真实绑定关系漂移。

## Error Handling

- backend 对外继续只返回安全错误：
  - 通用 message
  - `requestId`
- object storage 失败时：
  - 记录详细 backend log
  - 尝试 abort multipart upload
  - 将 upload session / import job 标记为失败
- 前端不显示底层存储/数据库细节，只显示：
  - 操作失败
  - `Request ID`

## Testing

### Storage Layer

- multipart create / upload / complete service tests
- env-driven storage config tests

### Backend

- upload session route tests
- file upload route tests
- metadata persistence tests
- dataset detail usage summary tests

### Frontend

- file upload dialog tests
- upload error / progress UI tests
- dataset list/detail metadata rendering tests

## Rollout Shape

推荐分两阶段：

1. 文件上传基础设施
   - backend multipart upload
   - dataset stored metadata
   - Portal file upload dialog
2. usage metadata 与 ingest 深化
   - dataset detail usage summary
   - worker 从 S3 读对象生成 preview
   - editor 消费真实 preview
