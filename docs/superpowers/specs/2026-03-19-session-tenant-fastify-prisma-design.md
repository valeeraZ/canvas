# Session Tenant Fastify Prisma Design

Date: 2026-03-19
Status: Approved in conversation
Scope: Persist principals and memberships during session exchange and attach tenant context to Fastify requests

## Summary

This change turns the current delegated auth flow into a real persistence and request-context foundation.

The repository already has:

- external auth endpoint integration
- token minting for session exchange
- Prisma models for `Tenant`, `Principal`, and `Membership`
- a Fastify session route

The repository does not yet:

- persist tenant and principal state when sessions are exchanged
- upsert memberships from external role data
- expose tenant context on Fastify requests

## Goals

- Persist `Tenant`, `Principal`, and `Membership` during session exchange
- Keep using the external authorization endpoints as the source of truth
- Attach tenant context to Fastify requests using the issued access token
- Add a protected verification route to prove tenant context wiring works

## Non-goals

- Full per-route RBAC enforcement across all modules
- Token signature verification hardening
- Realtime auth integration

## Design

### Persistence flow

During `POST /session/exchange`:

1. fetch current user and roles from the external auth service
2. build the host assertion as today
3. upsert a tenant record using the app name as the tenant slug
4. upsert a principal record using `employeeId`
5. upsert memberships for each role returned by the external auth service
6. mint and return the existing canvas access token

This keeps the existing session response shape stable while making the exchange route useful for the database-backed system.

### Store layer

Add three focused Prisma stores:

- `tenant-store.ts`
- `principal-store.ts`
- `membership-store.ts`

These stores own upsert and read operations, while existing builder helpers remain simple pure utilities for tests and fixtures.

### Fastify tenant context

Add a lightweight auth plugin that:

- reads `Authorization: Bearer <canvas token>`
- decodes the existing token format
- attaches `{ tenantId, roles }` to the Fastify request

Add one verification route, for example `GET /auth/me`, that returns the request tenant context so we can test the wiring end-to-end.

### Token decoding boundary

The token format is currently simple and internal:

`canvas.<tenantId>.<externalUserId>.<roles>`

For now, decoding will stay minimal and live in `packages/auth`, matching the current token minting strategy. This keeps the implementation aligned with the existing code rather than prematurely introducing a different token system.

## Testing

Add three layers of tests:

- store tests in `packages/db`
- Fastify route tests for session exchange persistence and tenant context
- a gated integration test using local PostgreSQL for session exchange persistence

## Success Criteria

- Session exchange writes tenant, principal, and membership rows
- Fastify request handlers can read tenant context from the access token
- A protected route can return the current tenant context
- Existing tests remain green
