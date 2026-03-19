# Datasets Fastify Prisma Design

Date: 2026-03-19
Status: Approved in conversation
Scope: Connect dataset HTTP routes to Fastify and Prisma-backed persistence

## Summary

This change turns the current dataset helpers into a real backend slice.

Today the repository has:

- dataset response mappers in `apps/backend`
- upload/session helpers that return shaped objects
- a real Prisma 7 client in `packages/db`
- no Fastify dataset plugin
- no Prisma-backed dataset persistence layer

The goal is to wire dataset listing, detail, and upload initiation into the backend runtime using Fastify routes backed by Prisma stores.

## Goals

- Add a Fastify dataset module
- Back dataset reads with Prisma
- Create dataset metadata and import job metadata through Prisma when an upload is initiated
- Keep existing mapping helpers focused on API shaping
- Preserve current tests and add route/store coverage

## Non-goals

- Running the worker pipeline from HTTP
- Realtime fanout for import changes
- Full file upload streaming
- Querying normalized dataset rows

## Design

### Backend module split

`apps/backend/src/modules/datasets/app.ts` will register:

- `GET /datasets`
- `GET /datasets/:datasetId`
- `POST /datasets/uploads`

The plugin receives:

- a database client
- a default tenant id for current development wiring

This keeps HTTP concerns separate from persistence and keeps the existing route helpers reusable.

### Prisma store layer

Add two focused store files in `packages/db`:

- `dataset-store.ts`
  - create dataset metadata
  - list tenant datasets
  - get a tenant dataset by id
- `import-job-store.ts`
  - create import job metadata for upload initiation

These stores will translate between Prisma records and existing contracts. The current builder helpers remain simple pure functions for tests and fixtures.

### Upload initiation flow

`POST /datasets/uploads` should:

1. create a dataset metadata row with status `queued`
2. derive the object key using the existing storage helper
3. create an import job row with status `queued`
4. return the upload target plus dataset summary

This gives us a real persisted record as soon as the upload session is created, without pretending the import already ran.

### Read flow

`GET /datasets` and `GET /datasets/:datasetId` should read from Prisma and shape responses through the existing mappers.

Warnings are stored in JSON and should be normalized to arrays in the store layer so the route layer stays small.

## Testing

Add tests at the seam where the runtime behavior matters:

- `packages/db/src/dataset-store.test.ts`
  - verify Prisma-backed record normalization
- `apps/backend/src/modules/datasets/app.test.ts`
  - verify Fastify route registration and responses using a stubbed DB interface

Keep the existing helper tests intact.

## Success Criteria

- Dataset routes are registered in Fastify
- Dataset upload initiation persists dataset and import job metadata
- Dataset list and detail endpoints read through Prisma-backed stores
- Existing Vitest suites remain green
