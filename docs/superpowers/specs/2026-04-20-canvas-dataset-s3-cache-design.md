# Canvas Dataset S3 Cache Design

## Summary

This change replaces the current dataset pipeline, which stores normalized dataset records in the database and uses those records directly for preview and widget rendering.

The new model treats S3 as the source of truth for dataset file contents. The database stores only stable dataset metadata, upload ownership, app assignment, visibility context, and lightweight schema/profile information. Full dataset contents are parsed on demand and cached per dataset for dashboard/widget rendering.

## Goals

- Upload dataset files directly to S3-backed storage without persisting full row/record payloads in the database.
- Persist only lightweight schema/profile metadata needed for widget configuration.
- Add visible upload progress during file upload.
- Preserve upload progress and status across navigation, with a top-right global upload indicator.
- Allow dashboard/widget rendering to load dataset contents lazily from S3 and cache them per dataset.
- Show loading states while dataset content is being hydrated for widgets.
- Move dataset portal routes to app-scoped URLs.
- Show a unified dataset inventory including uploaded datasets and datasets visible through shared dashboards.
- Record uploader `display_name` and `employee_id` when the dataset is created.
- Let the uploader choose the destination app from the set of accessible apps where `roles` is non-empty.
- Add a download button that requests a short-lived presigned download URL on demand.

## Non-Goals

- Storing presigned URLs in the dataset table
- Implementing true byte-perfect parse progress for server-side cache hydration
- Building a generalized file lakehouse or query engine
- Reworking dashboard sharing semantics beyond dataset visibility derived from existing dashboard access

## Current Problems

The current implementation mixes three responsibilities:

- object storage upload
- persistent normalized dataset storage in the database
- widget rendering data source

That causes several issues:

- uploads finish with a queued state but do not give users an actionable or persistent progress experience
- full dataset records are stored in the database, which is not desired
- widget rendering depends on preview/record persistence that conflicts with the desired S3-first model
- dataset routes still had legacy non-app-scoped behavior, causing authorization drift when a stale selected app was stored in session

## Recommended Approach

Use a layered model:

1. **S3 is the source of truth** for uploaded dataset file contents.
2. **Database stores dataset metadata and schema profile only**.
3. **Redis or another fast cache stores full parsed dataset payloads per dataset** when first needed for widget rendering.
4. **Portal routes for datasets become app-scoped**, matching dashboard routing.

This keeps storage responsibilities clean:

- S3 stores the canonical file
- DB stores durable metadata
- cache stores derived, disposable parsed content

## Data Model

### Dataset Table

The dataset row should continue to store durable fields such as:

- `tenantId` / app assignment
- `name`
- `uploadedByDisplayName`
- `uploadedByExternalUserId` or employee id
- `uploadedAt`
- `sourceFilename`
- `contentType`
- `sizeBytes`
- `storageBucket`
- `storageObjectKey`
- `storageUploadId`
- `importStatus`

The dataset should also store lightweight profile/schema metadata:

- `columns`
- inferred type metadata per column
- optional sample rows
- optional row count if cheaply available

The full normalized `records` payload should no longer be persisted.

### Cache Model

Parsed dataset content should be cached per dataset, keyed by dataset identity and version, for example:

- `dataset:{datasetId}:parsed:v{version}`

The cached payload may include:

- normalized rows
- typed values
- fast lookup structures needed by chart query and widget rendering

The cache is disposable and can be rebuilt from S3.

## Upload Lifecycle

Datasets move through explicit states:

- `uploading`
- `uploaded`
- `profiling`
- `ready`
- `failed`

### Upload Flow

1. User selects a target app from apps where `roles.length > 0`.
2. User uploads a file.
3. Frontend shows live upload progress.
4. Backend streams file to S3.
5. Dataset row is created with ownership and target app metadata.
6. Background profiling extracts schema metadata only.
7. Dataset becomes `ready` for widget configuration.

### Progress UX

Progress should exist at two levels:

- local progress inside the upload dialog
- global progress in the top-right corner that survives page changes

The global progress store should track uploads by `uploadId` or `datasetId`, and show:

- uploading percent
- uploaded / profiling
- ready
- failed

When ready, the UI should show a completion notice.

## Dataset Inventory

The dataset inventory page should show a unified list, not split into separate sections.

Each row represents a dataset and can be visible because:

- the current principal uploaded it
- or a dashboard visible to the current principal references it

Each row should show:

- dataset name
- dataset status
- uploader display name
- uploader employee id
- dataset app
- linked dashboard rows when applicable

Each linked dashboard row should show:

- dashboard name
- dashboard author
- dashboard app

This inventory is a visibility aggregation, not simply “datasets in current app”.

## App Assignment

Dataset creation must take an explicit `appName`.

The backend should validate:

- the app is in the principal’s accessible app list
- the app has at least one role for the principal

This app becomes the dataset’s owning app at creation time.

## Widget Configuration And Rendering

### Widget Configuration

Widget configuration needs only schema metadata, not full records.

Once a dataset is `ready`, widget configuration can use:

- columns
- inferred types
- optional samples for UI hints

This supports selecting:

- x axis
- y axis
- series field
- pie chart category/value fields

### Widget Rendering

Widget rendering should use dataset-level parsed cache:

1. Widget requests data for a dataset.
2. Backend checks dataset parsed cache.
3. If cache exists, it serves from cache.
4. If cache is missing, backend triggers dataset hydrate from S3.
5. Widgets show loading while the hydrate runs.

Multiple widgets using the same dataset should share the same hydrate process.

### Loading UX

Widget loading should show staged progress or clear status:

- fetching source
- parsing
- caching
- ready

Exact parse percentage is not required for the first iteration. A staged loader is sufficient.

## Background Jobs

### `dataset_profile_job`

Triggered after upload completes.

Responsibilities:

- read uploaded source from S3
- infer columns and types
- optionally compute sample rows and row count
- persist schema/profile metadata
- mark dataset `ready`

This job must not persist full normalized records.

### `dataset_cache_hydrate_job`

Triggered the first time a dashboard/widget needs full dataset content and cache is cold.

Responsibilities:

- read source file from S3
- parse full dataset into a rendering/query-friendly representation
- store parsed dataset in cache
- coordinate duplicate requests so one dataset is hydrated once

## Download Flow

Presigned URLs should not be stored in the database.

Instead:

- dataset detail/list exposes a `Download` action
- frontend requests a backend download-link endpoint
- backend validates dataset visibility for the current principal
- backend generates a short-lived presigned URL
- frontend uses that URL to download the source file

The database should store only stable object location fields.

## Routing

Datasets should mirror dashboard app-scoped routing:

- `/portal/[appName]/datasets`
- `/portal/[appName]/datasets/[datasetId]`

Legacy dataset routes should redirect into app-scoped routes.

## Permissions

Permissions are evaluated from:

- uploader ownership
- dashboard visibility relationships
- app-level accessibility from auth APIs

Dataset visibility should be derived server-side and returned as one aggregated inventory response.

## Testing Strategy

Backend:

- dataset upload creation with explicit appName validation
- profile job stores schema metadata only
- hydrate job caches parsed dataset content without DB row persistence
- dataset inventory aggregation for owned and shared visibility
- download URL endpoint returns short-lived URL only when authorized

Web:

- upload dialog with app selection filtered to apps where roles are non-empty
- local and global upload progress
- app-scoped datasets list/detail routes
- dataset inventory row rendering with uploader and linked dashboard context
- widget loading states while dataset hydrate is pending

## Risks

- Cache size may exceed practical Redis limits for large files.
- Existing preview/chart-query code assumes DB-backed records.
- Inventory aggregation may require new joins and indexing for scale.

## Mitigations

- Start with dataset-level cache abstraction so Redis can be swapped later.
- Replace record-backed preview usage with schema/profile-backed UI in one pass.
- Keep app-scoped routing and dataset visibility aggregation server-side to avoid client drift.
