# Local Postgres Compose Design

Date: 2026-03-19
Status: Approved in conversation
Scope: Add a local Docker Compose workflow for PostgreSQL development

## Summary

This change adds a minimal local PostgreSQL runtime for development and integration testing.

The repository currently has Prisma configuration and gated integration tests, but it does not provide a standard way to run a local database. This makes it harder to run Prisma migrations, seeds, and real Fastify plus Prisma integration tests.

## Goals

- Add a Docker Compose file for local PostgreSQL
- Standardize the local `DATABASE_URL`
- Add simple root scripts for starting and stopping the local database
- Document the local database workflow

## Non-goals

- Redis or S3 local development services
- Admin UIs such as pgAdmin
- Production deployment changes

## Design

The local database workflow lives under `infra/local`.

- `infra/local/docker-compose.yml`
  - one `postgres:16` service
  - port `5432`
  - database `canvas`
  - user `canvas`
  - password `canvas`
  - named volume for persistence
- `infra/local/README.md`
  - startup command
  - shutdown command
  - default `DATABASE_URL`
- root `package.json` scripts
  - `db:up`
  - `db:down`

This keeps local runtime concerns separate from Kubernetes deployment assets and makes the path for Prisma integration explicit.

## Success Criteria

- Compose file exists and defines a local Postgres service
- Local documentation explains how to start and stop the database
- Root scripts make the workflow easy to run
