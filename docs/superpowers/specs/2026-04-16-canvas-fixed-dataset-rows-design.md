# Canvas Fixed Dataset Rows Design

Date: 2026-04-16
Status: Draft approved in conversation
Scope: Dataset ingestion phase 1 revision (`CSV` only)
Supersedes: `/Users/sylvain/Work/canvas/docs/superpowers/specs/2026-04-06-canvas-redis-import-worker-design.md` sections that assumed one physical table per dataset

## 1. Product Summary

Canvas already supports dataset upload sessions, object-storage uploads, Redis-backed import queueing, and worker runtime foundations. The remaining ingestion work must satisfy one hard storage constraint:

- the database schema is fixed
- the set of physical tables is fixed
- imports may not create or drop tables dynamically

Phase 1 therefore uses a fixed `DatasetRow` table that stores imported CSV rows as typed `JSONB` records, while preserving Redis queue delivery and database-backed import job state.

## 2. Goals And Non-Goals

### Goals

1. Keep Redis-backed asynchronous import execution and database-backed job state.
2. Persist imported CSV content into one fixed table for all datasets.
3. Store each row as a typed JSON record using JSON-native values where practical.
4. Preserve `Dataset.preview` as a cached view for Portal and editor consumers.
5. Make the query layer read from the fixed row table using `datasetId`, not dynamic table names.

### Non-Goals

- dynamic table creation or schema mutation per dataset
- XLSX ingestion
- fully general SQL generation for arbitrary ad hoc analysis
- advanced indexing or materialized analytics tables
- multi-field grouping or complex expressions in phase 1

## 3. Storage Model

### Fixed table

Add a single `DatasetRow` model/table with:

- `id`
- `tenantId`
- `datasetId`
- `rowIndex`
- `record Json`

Suggested indexes:

- unique or indexed `(datasetId, rowIndex)`
- indexed `(tenantId, datasetId, rowIndex)`

All imported CSV rows live in this table. Re-importing a dataset replaces that dataset's existing rows instead of creating new tables.

### Dataset preview

`Dataset.preview` remains a cached JSON structure used by Portal and dashboard editing flows. It is updated by the worker after import and does not replace `DatasetRow`.

## 4. Row Shape And Type Rules

Each CSV row is normalized into an object whose keys are normalized headers and whose values are JSON-native types:

- blank / whitespace-only cells -> `null`
- `true` / `false` -> boolean
- numeric strings -> number
- recognized date or datetime strings -> normalized string representation
- everything else -> string

Dates remain strings in JSON for phase 1. They are semantically typed as dates in preview metadata and can later be cast in SQL as needed.

Example row:

```json
{
  "month": "2026-04-01",
  "revenue": 42,
  "is_active": true,
  "region": "APAC",
  "notes": null
}
```

## 5. Import Persistence Semantics

The worker persistence step changes from "build a per-dataset physical table" to "replace rows for one dataset in the shared table."

The persistence contract is:

1. delete existing `DatasetRow` records for the target dataset
2. insert the newly normalized rows with monotonic `rowIndex`
3. return row count for reporting/logging

This replacement happens only after the import job has been claimed and CSV parsing has succeeded.

## 6. Query Model

Phase 1 query execution no longer addresses datasets through `tableName`.

Instead:

- query contracts use `datasetId`
- SQL reads from the fixed `DatasetRow` table
- `tenantId` and `datasetId` scope every query
- dimensions are extracted via JSON field access
- measures are extracted and cast from JSON field values

Supported first-phase query capability:

- one grouping dimension
- measures: `count`, `sum`, `avg`

Field names must be validated against dataset preview columns before entering SQL generation.

## 7. Runtime Architecture

The Redis queue and worker runtime model from the earlier design remains valid:

- API creates import jobs and enqueues `jobId`
- worker dequeues, claims, imports, and updates status
- PostgreSQL remains the source of truth for job state and imported rows

Only the persistence target and query semantics change.

## 8. Component Boundaries

### `packages/db`

Add `DatasetRow` persistence and helper functions for replacing rows and querying by dataset.

### `apps/backend/src/modules/ingestion`

Normalize parsed CSV rows into typed JSON-ready objects and persist them via `DatasetRow` replacement helpers.

### `apps/backend/src/worker`

Keep orchestration responsibilities unchanged, but point persistence to the fixed row table helper.

### `apps/backend/src/modules/query`

Replace dynamic-table assumptions with `datasetId`-scoped fixed-table SQL generation and execution.

### `packages/contracts`

Update query contracts away from `tableName` and toward `datasetId`.

## 9. Error Handling

The failure model remains the same:

- parse failure -> dataset/job `failed`
- missing object -> dataset/job `failed`
- persistence failure -> dataset/job `failed`

If row replacement fails, existing rows for the dataset may already be deleted unless the operation is transactional. Phase 1 should therefore perform row replacement inside a database transaction.

## 10. Testing Strategy

### Unit tests

- typed row normalization
- dataset row replacement semantics
- query SQL generation from `datasetId` + field names

### Integration tests

- worker import writes `DatasetRow` records with typed JSON values
- re-import replaces rows for the same dataset
- query execution returns grouped aggregates from `DatasetRow`

### Verification

The revised phase is complete when:

1. CSV upload produces an import job and worker consumption
2. successful import writes fixed-table `DatasetRow` records
3. `Dataset.preview` remains available for existing UI consumers
4. query execution reads real aggregates from `DatasetRow`
5. focused tests and builds pass

## 11. Risks

- JSON field extraction and SQL casting must be carefully validated to avoid injection or broken casts.
- Replacing rows on re-import should be transactional to avoid partial dataset loss.
- Query flexibility is intentionally narrow in phase 1; expanding dimensions/measures later should not require another storage redesign.
