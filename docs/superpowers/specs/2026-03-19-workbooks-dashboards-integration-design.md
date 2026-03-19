# Workbooks Dashboards Integration Test Design

Date: 2026-03-19
Status: Approved in conversation
Scope: Add real PostgreSQL-backed Fastify integration tests for workbook and dashboard routes

## Summary

This change extends the existing local PostgreSQL integration coverage beyond datasets.

The repository already has:

- a local Docker Compose PostgreSQL workflow
- Prisma 7 runtime wiring
- gated dataset integration coverage
- Fastify workbook and dashboard routes backed by Prisma stores

The goal is to verify the workbook and dashboard route chains against the local database in the same way we already verify datasets.

## Goals

- Add a real integration test for workbook routes
- Add a real integration test for dashboard routes
- Reuse the gated `DATABASE_URL` pattern
- Verify create, list, and detail flows through Fastify and Prisma

## Non-goals

- Widget integration tests
- Query or chart integration tests
- Browser/E2E coverage

## Design

### Test shape

Add two files:

- `apps/backend/src/modules/workbooks/app.integration.test.ts`
- `apps/backend/src/modules/dashboards/app.integration.test.ts`

Each file:

- creates a real Prisma client from `DATABASE_URL`
- creates a real Fastify app with `createApiApp({ db, tenantId })`
- seeds an integration tenant in `beforeAll`
- cleans resource rows and tenant rows in `afterAll`

### Resource setup

Workbook integration test:

- create a workbook via `POST /workbooks`
- verify `GET /workbooks`
- verify `GET /workbooks/:id`

Dashboard integration test:

- seed a workbook row first, because dashboards can reference it
- create a dashboard via `POST /dashboards`
- verify `GET /dashboards`
- verify `GET /dashboards/:id`

### Gating

Both tests remain skipped when `DATABASE_URL` is absent.

This keeps local development lightweight while still allowing full runtime verification whenever the local database is available.

## Success Criteria

- Workbook integration test passes against local PostgreSQL
- Dashboard integration test passes against local PostgreSQL
- Full test suite stays green with `DATABASE_URL` set
