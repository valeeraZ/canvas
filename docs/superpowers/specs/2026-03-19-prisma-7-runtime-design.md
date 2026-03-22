# Prisma 7 Runtime Design

Date: 2026-03-19
Status: Approved in conversation
Scope: Upgrade `packages/db` and backend runtime wiring to Prisma 7 and Fastify

## Summary

This change upgrades the `canvas` database layer to Prisma 7 and completes the first real backend runtime wiring with Fastify.

The repository currently has:

- a Prisma schema written in the pre-v7 style
- repository helpers and tests that do not use a generated Prisma client
- backend route logic that exists as plain functions but is not mounted in a running Fastify app

The goal of this work is to migrate the database package to the Prisma 7 configuration model in one pass, including client generation and migrate compatibility, then expose a minimal Fastify app that can serve health and session routes using the shared modules.

## Goals

- Adopt Prisma 7 configuration and client generation in `packages/db`
- Keep `schema.prisma` focused on models while moving runtime config into `prisma.config.ts`
- Provide a single `createDbClient()` factory that owns Prisma 7 setup details
- Introduce a minimal Fastify app factory in `apps/backend`
- Mount the existing session exchange logic behind real HTTP routes
- Preserve existing tests and add focused runtime integration tests

## Non-goals

- Full CRUD repositories backed by live Prisma queries
- WebSocket transport integration
- Full worker bootstrapping
- Production deployment tuning

## Design

### Prisma 7 package layout

`packages/db` becomes the only place that knows Prisma 7 specifics.

It will contain:

- `prisma/schema.prisma`
  - model definitions only
  - Prisma 7 generator configuration
- `prisma.config.ts`
  - database connection and migration configuration
  - references to `DATABASE_URL`
- `src/generated/prisma`
  - generated Prisma 7 client output
- `src/client.ts`
  - exports `createDbClient()`
  - constructs the Prisma client using the generated client output and Postgres adapter

This keeps every other package insulated from Prisma 7 config details.

### Runtime boundaries

`packages/db` owns database runtime wiring.

- `createDbClient()` accepts the connection string
- it creates the Prisma adapter for PostgreSQL
- it returns the generated Prisma client instance

`apps/backend` owns HTTP runtime wiring.

- `createApiApp()` creates a Fastify instance
- it registers a `/health` route
- it mounts the existing session module on `/session/exchange`
- module business logic remains inside the existing session route helper

### Migration workflow

The Prisma 7 migration flow should be first-class, not a one-off workaround.

`packages/db/package.json` should expose scripts for:

- `prisma generate`
- `prisma migrate dev`
- `prisma db push`
- `prisma db seed`

These commands should resolve through `prisma.config.ts`, so local development and CI use the same configuration model.

### Testing

We only need enough testing to prove the runtime wiring exists and is stable.

- `packages/db/src/client.test.ts`
  - verifies the database client factory returns a disconnectable Prisma client
- `apps/backend/src/api/app.test.ts`
  - verifies the Fastify app can be created
  - verifies `/health`
  - verifies `/session/exchange`

Existing tests must remain green after the migration.

## Risks and Mitigations

### Prisma 7 configuration drift

Risk:
The generated client, schema, and migrate commands can drift if config is split across too many files.

Mitigation:
Keep all Prisma 7 config owned by `packages/db`, with a single generated client path and package scripts that always call the same config.

### Fastify integration creep

Risk:
Turning backend stubs into a real app could balloon into unrelated backend architecture work.

Mitigation:
Limit the runtime target to a minimal app factory plus the existing session route and health route.

### Generated client path churn

Risk:
Prisma 7 no longer defaults to `node_modules`, so imports can become fragile.

Mitigation:
Use a stable generated output path under `packages/db/src/generated/prisma` and keep all imports inside `packages/db`.

## Success Criteria

- Prisma 7 client generation succeeds from `packages/db`
- Prisma 7 migrate commands have a valid config entrypoint
- `createDbClient()` returns a real Prisma client instance
- `createApiApp()` serves health and session endpoints
- focused runtime tests pass
- existing repository and feature tests remain green
