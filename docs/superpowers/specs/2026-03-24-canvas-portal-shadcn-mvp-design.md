# Canvas Portal Shadcn MVP Design

## Summary

This design refines the existing Canvas Portal direction into a concrete UI implementation target for the current codebase.

The goal for this iteration is not a full authoring suite. It is a clean, usable Portal built with `shadcn/ui` that lets a user:

- sign in with an `amtoken`
- establish a Canvas server session
- switch the active app
- browse dashboards for the current app
- inspect a dashboard detail view
- manage selected-dashboard and share subjects through the existing web and backend routes

The Portal should feel like a real product surface, but it should stay close to currently implemented backend behavior.

## Goals

- Add real `shadcn/ui` foundations to `apps/web`
- Replace the current Portal placeholder views with a coherent management console
- Reuse the current Next.js API routes under `/api/canvas/*` as the Portal's integration boundary
- Preserve the existing backend auth model: `Authorization: Bearer <amtoken>` plus Canvas-managed `canvas_session`

## Non-Goals

- Building a full dashboard builder
- Completing import/export backend workflows
- Replacing the embed SDK viewer
- Introducing a second auth model beyond the current `amtoken + canvas_session`

## Product Flow

### 1. Login

The user lands on `/portal/login`.

They provide:

- an `amtoken`
- a default app

Submitting the form should call the web session route, which in turn talks to the backend session exchange endpoint and establishes the Canvas session cookie.

### 2. Portal Home

After login, the user lands on `/portal`.

This page should confirm the current app context, show principal details if available, and provide a clear path into dashboard management.

### 3. App Switching

The Portal shell exposes an app switcher in a persistent header/sidebar area.

Switching apps should call the existing app-selection API and refresh the currently shown dashboard data without requiring a fresh login.

### 4. Dashboard Management

The dashboards index page shows:

- dashboard cards or rows
- which dashboard is selected for embed
- quick navigation into a detail page

The dashboard detail page shows:

- dashboard metadata
- selected-dashboard status and action
- current share subjects
- share subject editor form
- export/import affordances as explicit UI placeholders

## Technical Design

### UI Foundation

`apps/web` should adopt the standard `shadcn/ui` shape:

- Tailwind CSS
- `app/globals.css`
- `src/lib/utils.ts`
- `src/components/ui/*`

The Portal should use `shadcn/ui` primitives for:

- buttons
- cards
- inputs
- labels
- selects
- dialogs
- badges
- separators
- textarea if needed for token entry or subject input

### Routing

The Portal routes for this iteration are:

- `/portal/login`
- `/portal`
- `/portal/dashboards`
- `/portal/dashboards/[dashboardId]`

`/portal` should behave as the shell entry point and redirect or render based on whether a session is present.

### Data Access Boundary

Portal pages should continue to use `apps/web/src/app/api/canvas/*` routes rather than calling the backend cross-origin directly.

This preserves a stable boundary for:

- request shaping
- cookie handling
- future auth evolution

The Portal API client should become the single frontend entry point for:

- session exchange
- current session lookup
- app switching
- dashboard list/detail
- selected dashboard get/set
- share subject updates

### State Model

The minimal client state is:

- `amtoken`
- `selectedApp`
- dashboard list
- selected dashboard id
- active dashboard detail

Where possible, server pages should fetch initial data and pass it into client components to avoid unnecessary client waterfalls.

### Styling Direction

The Portal should look operational and focused rather than decorative:

- light-first palette
- high contrast cards and controls
- strong information hierarchy
- compact management layout

The interface should prioritize clarity over motion-heavy presentation.

## File Boundaries

### New/Expanded Foundation Files

- `apps/web/src/app/globals.css`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/components/ui/*`

### Portal UI Files

- `apps/web/src/app/portal/login/page.tsx`
- `apps/web/src/app/portal/layout.tsx`
- `apps/web/src/app/portal/page.tsx`
- `apps/web/src/app/portal/dashboards/page.tsx`
- `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- `apps/web/src/components/portal/portal-shell.tsx`
- `apps/web/src/components/portal/app-switcher.tsx`
- `apps/web/src/components/portal/login-form.tsx`
- `apps/web/src/components/portal/dashboard-list.tsx`
- `apps/web/src/components/portal/dashboard-editor.tsx`
- `apps/web/src/components/portal/dashboard-share-panel.tsx`

### Portal Data Files

- `apps/web/src/lib/portal/api-client.ts`
- small route helpers under `apps/web/src/app/api/canvas/*` as needed

## Testing Strategy

This implementation should follow TDD:

- component tests for login, switcher, list, and editor behaviors
- route tests for any new or updated web API handlers
- focused page render tests where useful

The key behavioral checks are:

- login form submits and reaches session exchange
- Portal shell reflects the current app
- app switching triggers the correct API call
- dashboard list shows selected-dashboard state
- dashboard detail submits share and selected-dashboard actions through the current routes

## Risks and Mitigations

### Risk: UI scaffolding balloons beyond current backend support

Mitigation:

- keep import/export as explicit placeholders
- avoid building a fake editor surface
- keep focus on login, app context, dashboards, and share

### Risk: Session state is hard to observe from the web layer

Mitigation:

- centralize Portal data access in a single API client
- keep login and app switching on the Next.js API layer

### Risk: Tailwind/shadcn setup churn affects existing web routes

Mitigation:

- keep styles additive
- avoid changing embed-demo behavior unless required by the shared root layout
- add focused tests around Portal and any shared helpers
