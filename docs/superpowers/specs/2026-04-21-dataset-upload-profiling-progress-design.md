# Dataset Upload Profiling Progress Design

## Summary

Dataset uploads should keep the existing asynchronous job boundary, but the job should profile uploaded files instead of importing full rows into the database. The user experience should show two phases: browser upload progress and backend profiling status. When profiling finishes, the portal should show a top-right completion notification and refresh dataset status.

## Decision

Keep the worker/job module for durability and recovery. Do not move parsing into the upload HTTP request.

Reasons:

- Upload requests should not remain open while large files are parsed.
- Worker jobs can be retried and reconciled after API or worker restarts.
- Redis queue plus a database job record cleanly separates runtime delivery from durable state.
- The UI can show truthful progress: byte progress for upload, phase status for profiling.

## State Model

- `uploading`: frontend-only state while the browser streams the file.
- `profiling`: backend state after S3 upload succeeds and the worker needs to extract schema metadata.
- `ready`: profiling succeeded and the dataset can be used for widget configuration.
- `failed`: upload or profiling failed.

For compatibility, old `queued` and `processing` states may still be treated as pending in the UI while the backend transition is completed.

## Backend Behavior

The upload route should:

- create a dataset and upload job
- stream the file to S3
- update storage metadata
- mark the dataset/job as `profiling`
- enqueue the job for the worker

The worker should:

- claim the queued/profiling job
- read the uploaded file from S3
- parse only enough content to infer `columns`, `sampleRows`, and lightweight metadata
- store the preview/schema on the dataset row
- mark dataset/job `ready`
- never write full normalized rows into `DatasetRow`

The existing `ImportJob` table remains for now, but its semantic role becomes "dataset profiling job". A later migration can rename it if needed.

## Frontend Behavior

The upload dialog should:

- create an upload session
- upload the selected file with browser-visible byte progress
- hand off the upload task to a portal-level global upload store
- close safely while the global upload indicator remains visible

The global upload indicator should:

- render in the top-right of portal pages
- show upload percentage while uploading
- show profiling while backend status is pending
- poll dataset status every 2-3 seconds
- show success when status becomes `ready`
- show failure when status becomes `failed`

## Non-Goals

- SSE/WebSocket realtime transport
- exact backend parse percentage
- schema/table migration or renaming `ImportJob`
- full dashboard cache hydration implementation
