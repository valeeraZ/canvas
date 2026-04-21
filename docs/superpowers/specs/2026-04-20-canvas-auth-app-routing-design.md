# Canvas Auth App Routing Design

## Summary

This change replaces Canvas Portal's mock and session-selected app flow with a real auth-backed app inventory and URL-addressable app scope.

The auth API at `localhost:8000` becomes the source of truth for:

- the current principal
- which apps the principal can access
- each app's display metadata (`app_display_name`, `app_logo_name`)

Canvas remains the source of truth for dashboards and dataset content inside each app.

## Goals

- Use the real auth API instead of the current mock auth path.
- Show the overview page as a grid/list of accessible apps.
- Show each app card with display name, Lucide icon, and the most recently created or updated dashboard for that app.
- Remove the workbook concept from the portal product surface.
- Move app context into the URL so shared dashboard URLs are directly accessible when the viewer has permission.
- Render breadcrumbs that reflect `Portal / App / Dashboard`.

## Non-Goals

- Removing workbook tables or Prisma fields from the database in this iteration
- Rebuilding all backend APIs around a new auth model
- Changing dashboard editor behavior beyond routing, breadcrumb, and workbook-related copy

## Current Problems

The current portal assumes a two-step app flow:

1. select an app into server-side session state
2. navigate into app-scoped pages that implicitly read that selected app

That causes two issues:

- copied dashboard URLs are not self-contained because the app context is not in the URL
- the overview and auth layers still depend on mock-oriented behavior and workbook-era UI

The current auth integration also does not match the actual mock auth server shape. The auth API exposes:

- `GET /v1/authorization/current_user`
- `GET /v1/authorization/roles`
- `GET /v1/app/{app_id}`

Canvas still has code paths expecting app-specific role endpoints and session-driven app switching.

## Recommended Approach

Keep Canvas backend as the BFF between the web app and the external auth API.

The backend will:

- call the auth API to resolve principal, accessible apps, and app metadata
- authorize app access for URL-driven requests
- continue to read dashboards from Canvas storage
- expose aggregated app inventory responses for the portal overview

The web app will:

- stop calling the app-switch endpoint for normal navigation
- render overview as app cards
- route app pages as `/portal/[appName]`
- route dashboard pages as `/portal/[appName]/[dashboardId]`

This preserves a single integration boundary for auth while making app URLs shareable and permission-checked.

## Route Design

Portal routes will become:

- `/portal`
- `/portal/[appName]`
- `/portal/[appName]/[dashboardId]`

Behavior:

- `/portal` shows all accessible apps
- `/portal/[appName]` shows dashboards for that app
- `/portal/[appName]/[dashboardId]` shows the dashboard viewer/editor for that app

The app name in the URL becomes the effective app scope for the page request. Session state may still store the token and recent activity, but it no longer decides which app is active for page routing.

## Data Model Mapping

Within this iteration:

- auth API `app_name` maps to Canvas app scope / tenant scope
- auth API current user maps to the current principal
- dashboard data stays stored per tenant/app inside Canvas

Workbook remains a persistence detail only where existing database compatibility requires it. It is removed from the portal UX and routing model.

## Backend Changes

### Auth package

Update `packages/auth` so it reflects the real auth API:

- `fetchCurrentPrincipal()` reads `/v1/authorization/current_user`
- `fetchAccessibleApps()` reads `/v1/authorization/roles`
- a new app metadata fetcher reads `/v1/app/{app_id}`
- app authorization is derived by checking whether the requested `appName` exists in the accessible app list and reading its roles from that list

### Backend auth module

Keep `/auth/apps` but expand it into an inventory endpoint that can power the overview:

- principal
- accessible apps
- app display metadata

Add or refactor helpers so app-scoped routes can authorize against an explicit `appName` instead of only the selected app stored in session.

### Backend app inventory aggregation

Add a backend aggregation path that, for every accessible app:

- fetches app display metadata from auth API
- queries Canvas dashboards for that app
- chooses the most recent dashboard by `updatedAt` when available, otherwise by `createdAt`, otherwise stable list order

That response will drive the overview cards.

## Web Changes

### Overview page

The overview page becomes the main app entry point:

- shows accessible apps as cards
- each card shows the auth display name
- each card renders the Lucide icon matching `app_logo_name`
- each card shows the latest dashboard summary
- clicking the card links directly to `/portal/[appName]`

No workbook information is shown.

### App dashboards page

The app page:

- loads using the `appName` route param
- verifies access through backend data fetches
- shows dashboards for that app
- uses breadcrumbs `Portal / {App Display Name}`

### Dashboard detail page

The dashboard page:

- loads using both `appName` and `dashboardId`
- validates that the dashboard belongs to the route app
- preserves current viewer/editor behavior
- uses breadcrumbs `Portal / {App Display Name} / {Dashboard Name}`

### Portal shell

The shell removes workbook navigation and stops presenting session-based app switching as the primary interaction. App navigation should prefer links derived from the URL structure.

## Error Handling

- Missing portal session still routes to login.
- Unknown or unauthorized app returns a clear unauthorized or not-found state.
- Unknown dashboard inside an authorized app returns not found.
- Auth API failures should surface as backend request failures without leaking implementation details.

## Testing Strategy

Backend:

- auth package tests for current user, roles, and app metadata fetchers
- auth module tests for `/auth/apps` inventory response
- authorization tests for explicit appName validation

Web:

- overview page test for display name, icon-backed app card content, latest dashboard summary, and workbook removal
- app page tests for `/portal/[appName]`
- dashboard page tests for `/portal/[appName]/[dashboardId]`
- portal shell tests ensuring workbook navigation is absent and breadcrumbs reflect app/dashboard hierarchy

## Risks

- Existing code assumes `selectedApp` is the active scope in many backend-client methods.
- Some dashboard and export flows still carry `workbookId` in contracts.
- Lucide icon names come from external data and require safe runtime mapping/fallback handling.

## Mitigations

- Keep token/session storage but move app scope determination to route params.
- Remove workbook from UX first and leave compatibility fields intact.
- Use a controlled icon lookup with a fallback icon when a Lucide export is unknown.
