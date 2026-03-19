# Workbooks Dashboards Fastify Prisma Design

Date: 2026-03-19
Status: Approved in conversation
Scope: Connect workbook and dashboard HTTP routes to Fastify and Prisma-backed persistence

## Summary

This change extends the backend runtime beyond datasets by wiring workbook and dashboard resources into Fastify and Prisma.

The repository already has:

- Prisma models for `Workbook` and `Dashboard`
- simple builder helpers in `packages/db`
- pure route helpers in `apps/backend`
- a real Fastify app factory and Prisma client wiring

The goal is to expose create, list, and detail endpoints for both resources using the same layered structure already established for datasets.

## Goals

- Add Prisma-backed workbook and dashboard stores
- Add Fastify plugins for workbook and dashboard routes
- Support `GET`, `POST`, and `GET by id` for both resources
- Keep runtime wiring compatible with both real Prisma and stubbed services

## Non-goals

- Widget CRUD
- Publishing workflows
- Sharing or permissions beyond the existing tenant scope input
- Realtime updates for workbook or dashboard changes

## Design

### Store layer

Add two focused store files:

- `packages/db/src/workbook-store.ts`
- `packages/db/src/dashboard-store.ts`

Each store will own:

- `create`
- `listByTenant`
- `findByTenantAndId`
- pure normalization helpers for persisted records

This keeps Prisma-specific concerns out of Fastify route registration.

### Fastify module layer

Add two Fastify plugins:

- `apps/backend/src/modules/workbooks/app.ts`
- `apps/backend/src/modules/dashboards/app.ts`

Each plugin will register:

- `GET /workbooks`
- `POST /workbooks`
- `GET /workbooks/:workbookId`

- `GET /dashboards`
- `POST /dashboards`
- `GET /dashboards/:dashboardId`

The dashboard create route accepts optional `workbookId`.

### Runtime wiring

`createApiApp()` will be extended so it can:

- auto-create workbook and dashboard services when a real Prisma client is provided
- accept stubbed services for focused Fastify tests

This preserves the testing strategy already used for datasets.

### Response shape

Workbook responses:

- `id`
- `tenantId`
- `name`

Dashboard responses:

- `id`
- `tenantId`
- `name`
- `workbookId`

404 responses return a small `{ message }` payload, matching the existing dataset route style.

## Testing

Add two test layers:

- store tests in `packages/db`
- Fastify route tests in `apps/backend`

If the route layer works with stubs and the store layer works with Prisma-backed record translation, the composition inside `createApiApp()` is low risk.

## Success Criteria

- Workbooks and dashboards can be created through Fastify
- Workbooks and dashboards can be listed and fetched by id
- Prisma-backed store layers exist for both resources
- Existing tests remain green
