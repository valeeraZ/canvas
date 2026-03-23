# Canvas App Portal and Embed Viewer Design

Date: 2026-03-22
Status: Draft approved in conversation
Scope: Product model v2 (`tenant` expressed as `app`)

## 1. Product Summary

`canvas` now has two first-class product surfaces:

- `Canvas Portal` (standalone web app)
- `Embed SDK Viewer` (host app integration surface)

`Canvas Portal` is where users log in, choose an `app`, and perform authoring/management actions such as create/edit/share/export/import dashboards.

`Embed SDK Viewer` is where a host app user selects from dashboards they are allowed to see and displays one dashboard inside the host UI. Different users in the same app can select different dashboards.

## 2. Identity and Access Model

### Terminology

- `app` is the primary isolation boundary (`tenant == app` in prior docs/code)
- `principal` is a user identity
- `visibility subject` is a principal, group, or role allowed to view a dashboard

### Login and token flow

1. User logs into `Canvas Portal` through Canvas-owned SSO UI.
2. Canvas obtains an `amtoken`.
3. Canvas backend receives `amtoken`.
4. Canvas backend calls external authorization APIs:
   - `GET {auth_base_url}/v1/authorization/current_user`
   - `GET {auth_base_url}/v1/authorization/roles/{app_name}`
5. Canvas maps `amtoken -> principal + app-scoped roles (+ groups when available from external auth source)`.
6. Canvas stores the active `app` in a Canvas-managed server-side session and cookie.
7. Canvas caches resolved authorization context for `(amtoken, app)` with a short TTL.

### Current backend session model

- `amtoken` is the only identity credential sent to Canvas APIs
- Canvas does not rely on a separate long-lived Canvas access token in the main runtime path
- Canvas-managed session state stores only lightweight app context:
  - `sessionId`
  - `selectedApp`
  - `externalUserId`
- authorization cache and session state are short-lived and designed for Redis-backed storage with in-memory fallback for local development and tests

### Host app path

Host frontends also have `amtoken` in their own cookies. Host integrations forward `Authorization: Bearer <amtoken>` to Canvas backend so Canvas can resolve principal and app visibility using the same external authorization truth source.

## 3. Product Surfaces

### Canvas Portal (standalone)

- Login
- App switcher (a user can have access to multiple apps)
- Dashboard authoring (create/edit)
- Sharing management (user/group/role visibility)
- Export/import actions
- Publish and lifecycle actions

### Embed SDK Viewer

- Session bootstrap for app context
- "My visible dashboards" list for current principal in current app
- Per-user dashboard selection in host UI
- Dashboard rendering/view mode

Out of scope for SDK v2: full dashboard builder/editor.

## 4. Dashboard Distribution Model

Each dashboard has two independent layers:

- `publication`: dashboard is published to an app context
- `visibility`: who can see it in that app (users, external groups, external roles)

No implicit global visibility: if the user/group/role is not shared, it is not visible.

Each principal also has a per-app preference:

- `selectedDashboardId` for host embed display

## 5. Data Model Changes

### Core entities

- `Application` (rename/replace `Tenant` naming in APIs and runtime context)
- `Principal`
- `AppMembership` (principal <-> app relationship)
- `Dashboard`
- `DashboardPublication`
- `DashboardVisibilityRule` (`subjectType = user|group|role`, `subjectId`)
- `PrincipalAppPreference` (`selectedDashboardId`)

### Contracts/runtime naming

- replace request `tenantContext` with `appContext`
- Canvas session stores selected app, while `amtoken` remains the source credential
- route authorization checks are app-scoped

## 6. API Shape (v2)

### Auth/session

- `POST /session/exchange` (accepts `amtoken`, resolves the selected app, sets Canvas session cookie)
- `GET /auth/me` (principal + selected app + effective roles/groups snapshot using `amtoken + session`)
- `POST /auth/select-app` (switch active app context inside Canvas session)

### Dashboard management (Portal)

- `GET /apps/:appId/dashboards`
- `POST /apps/:appId/dashboards`
- `PATCH /apps/:appId/dashboards/:dashboardId`
- `POST /apps/:appId/dashboards/:dashboardId/share`
- `POST /apps/:appId/dashboards/:dashboardId/export`
- `POST /apps/:appId/dashboards/import`

### Embed viewer

- `GET /apps/:appId/visible-dashboards`
- `POST /apps/:appId/principals/me/selected-dashboard`
- `GET /apps/:appId/principals/me/selected-dashboard`

## 7. Migration Strategy

1. Keep existing schema/runtime working while introducing v2 `app` naming adapters.
2. Add v2 tables and app-context middleware.
3. Migrate existing tenant-scoped routes to app-scoped aliases.
4. Move builder UX from SDK-focused path into Portal modules.
5. Keep SDK backward-compatible during transition with explicit deprecation docs.

## 8. Testing Strategy

- Unit tests for:
  - amtoken translation and auth mapping
  - visibility evaluation (user/group/role)
  - per-user selected dashboard behavior
- Fastify integration tests for:
  - app selection
  - visible dashboard filtering
  - share/export/import endpoints
- DB integration tests with local Postgres for portal and embed viewer workflows

## 9. Risk Notes

- External group semantics are owned by external auth system; Canvas must treat group IDs as opaque.
- App context switching is security-sensitive; every route and realtime channel must require app context.
- Session state must stay intentionally small because active user count can be large; Redis-backed TTL storage is the primary target.
- Existing `tenant` naming in code can create subtle regressions during migration if mixed with new app-scoped session logic.
