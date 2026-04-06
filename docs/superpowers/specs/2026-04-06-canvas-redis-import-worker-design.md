# Canvas Redis Import Worker Design

Date: 2026-04-06
Status: Draft approved in conversation
Scope: Dataset ingestion phase 1 (`CSV` only)

## 1. Product Summary

Canvas already supports dataset upload session creation, file streaming to object storage, and Portal inventory pages for dataset state. The next phase is to make uploaded CSV files flow through a real asynchronous import pipeline that runs outside the API request path.

Phase 1 will keep the upload UX unchanged while introducing:

- Redis-backed runtime queueing for import work
- database-backed import job state and audit history
- a dedicated backend worker mode
- CSV parsing, normalization, preview generation, and normalized persistence

This phase intentionally excludes XLSX ingestion, advanced retry policies, and a dedicated Portal job-management surface.

## 2. Goals And Non-Goals

### Goals

1. Uploading a CSV creates an import job and enqueues it for asynchronous processing.
2. A dedicated worker process can consume queued jobs from Redis and execute imports without blocking API requests.
3. Successful imports update dataset and job state to `ready` and persist normalized results for later query use.
4. Failed imports update dataset and job state to `failed` and preserve human-readable failure details.
5. The current Portal dataset pages can reflect import progress via existing dataset status fields.

### Non-Goals

- XLSX parsing or mixed-format ingestion
- production-grade retry backoff, dead-letter queues, or infinite retries
- pub/sub broadcast semantics
- a separate operator UI for import jobs
- replacing `import_jobs` with Redis as the only source of truth

## 3. Queue Model

This phase uses a work-queue pattern, not pub/sub.

- Redis is responsible for runtime wake-up and delivery.
- PostgreSQL remains the source of truth for import job state, errors, and recovery.
- The Redis payload is only the `jobId`.
- A worker that receives a `jobId` must re-read the job from the database before doing work.

The queue contract is:

1. API writes `import_jobs` row with `queued` status.
2. API enqueues `jobId` into a Redis list.
3. Worker blocks on Redis dequeue.
4. Worker attempts to atomically claim the database row.
5. Only a successfully claimed `queued` job may execute.

This keeps Redis lightweight while preventing state drift between Redis payloads and database records.

## 4. State Model

### Import job state

`import_jobs.status` uses:

- `queued`
- `processing`
- `ready`
- `failed`

### Dataset state

`datasets.status` and `datasets.importStatus` move in lockstep for this phase:

- upload session created: `queued`
- worker starts import: `processing`
- import succeeds: `ready`
- import fails: `failed`

Warnings and failure details are stored on the job and copied into dataset-facing fields when needed for Portal visibility.

## 5. Runtime Architecture

### API mode

API mode keeps ownership of:

- upload session creation
- file upload streaming to object storage
- import job creation
- enqueueing the created job into Redis

API mode does not parse or import CSV content after upload completes.

### Worker mode

Worker mode is a separate backend runtime entrypoint that shares:

- environment/config loading
- Prisma client access
- Redis connectivity
- storage configuration

Worker mode owns:

- blocking dequeue from Redis
- job reconciliation on startup
- job claim / execute / complete / fail transitions
- ingestion pipeline orchestration

## 6. Data Flow

### Happy path

1. User uploads a CSV through the existing Portal upload flow.
2. Backend streams the file into object storage.
3. Backend creates `import_jobs` record with `queued`.
4. Backend pushes `jobId` into Redis.
5. Worker dequeues `jobId`.
6. Worker atomically claims the job by changing DB status from `queued` to `processing`.
7. Worker loads the object from storage.
8. Worker parses CSV and normalizes headers and rows.
9. Worker generates dataset preview metadata.
10. Worker writes normalized data into the canonical storage layer used by later query work.
11. Worker updates dataset preview and marks both dataset and job `ready`.

### Failure path

If any step after claim fails:

1. Worker records failure details on the import job.
2. Worker updates dataset/import status to `failed`.
3. Worker logs the failure with the `jobId`, `datasetId`, and object location.

No automatic requeue happens during normal failure handling in phase 1.

## 7. Recovery Strategy

Redis list semantics alone are not enough for recovery, so worker startup includes a reconciliation pass.

The worker will:

- find `queued` jobs that are missing from in-flight execution and enqueue them
- find `processing` jobs older than a timeout threshold
- reset timed-out `processing` jobs back to `queued`
- re-enqueue those reset jobs

This gives the system a minimal crash-recovery path without adding consumer groups or lease tables in phase 1.

## 8. Component Boundaries

### `packages/queue`

Add a Redis-backed import queue abstraction that:

- enqueues `jobId`
- blocks waiting for `jobId`
- optionally checks queue membership support needed for reconciliation helpers

It should expose a narrow interface so the project can later migrate from Redis list to Redis streams without changing worker orchestration code.

### `packages/db`

Extend import job persistence to support:

- creation
- atomic claim of queued jobs
- success transition
- failure transition with warnings
- timed-out processing reset
- reconciliation queries

### `packages/storage`

Extend storage support with object-read capability needed by worker ingestion. Upload-only support is not enough once imports become asynchronous.

### `apps/backend/src/modules/datasets`

Keep dataset upload routes focused on upload orchestration:

- stream file to object storage
- persist dataset metadata
- create import job
- enqueue job

### `apps/backend/src/worker`

Add worker orchestration:

- queue loop
- reconciliation loop
- single-job executor
- graceful shutdown

### `apps/backend/src/modules/ingestion`

Promote current parser/normalize helpers from placeholder status into the real CSV import pipeline.

## 9. Error Handling

Phase 1 keeps error handling intentionally simple:

- invalid or unreadable CSV results in `failed`
- missing object storage file results in `failed`
- duplicate queue delivery is ignored by DB claim semantics
- worker crash recovery depends on reconciliation, not immediate retry

Errors returned to Portal remain sanitized. Detailed failure text lives in job warnings/logging and can later be surfaced in operator tooling.

## 10. Testing Strategy

### Unit tests

- Redis queue enqueue/dequeue contract
- import job claim and reconciliation store helpers
- CSV parsing and normalization edge cases
- worker executor success and failure transitions

### Integration tests

- dataset upload route creates a queued job and enqueues it
- worker consumes a queued job and updates dataset/job state
- worker failure marks dataset/job failed

### Verification

The implementation is complete for phase 1 when:

1. a CSV upload leads to a queued job
2. worker mode consumes that job from Redis
3. dataset transitions to `ready`
4. preview data is available for existing Portal/editor consumers
5. focused backend tests and build verification pass

## 11. Risks

- Redis list delivery is simple but not durable enough on its own, so reconciliation correctness matters.
- The current normalized-table persistence layer is still lightweight; it must be upgraded carefully without overbuilding a full analytics engine in this phase.
- Upload routes currently accept `.xlsx` in the UI; phase 1 implementation must either restrict UI acceptance to CSV or fail non-CSV inputs explicitly and clearly.
