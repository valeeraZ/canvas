# Canvas Portal Shadcn Console Redesign

## Summary

This design replaces the current Portal presentation layer with a denser, more coherent data-console experience built from real `shadcn/ui` components and composition patterns.

The current Portal already supports the right flow:

- login with an `amtoken`
- establish a Canvas portal session
- switch the active app
- list dashboards
- open a dashboard detail page
- edit embed selection and sharing state

What it lacks is a convincing design system and information architecture. The visual language is still too custom and too page-centric. This redesign moves the Portal to a true console layout with `Sidebar`, `Breadcrumb`, denser `Table` views, and more disciplined `shadcn/ui` composition.

## Goals

- Replace the current page/card-heavy portal shell with a `Sidebar` control-console layout
- Move Portal navigation, app context, and principal status into stable console chrome
- Replace ad hoc dashboard list presentation with a denser tabular control surface
- Refactor dashboard detail into structured `shadcn` sections instead of a single long page
- Standardize Portal interactions around existing `shadcn/ui` patterns and semantic tokens

## Non-Goals

- Adding new backend endpoints
- Reworking business logic for dashboard sharing, selection, or session flow
- Building a full dashboard builder/editor canvas
- Rewriting the embed SDK viewer

## Experience Direction

The Portal should feel like a data operations console:

- information-dense
- precise
- low-chrome
- high contrast between navigation, data regions, and utility surfaces
- optimized for “scan, filter, choose, act”

This means:

- persistent navigation instead of isolated marketing-style pages
- tables over card grids when comparing records
- compact metadata summaries
- stable action placement
- strong hierarchy through layout rather than decorative surfaces

## Information Architecture

### Shell

The Portal shell becomes the persistent application frame for all authenticated routes.

It should include:

- `Sidebar` navigation
- a compact header with `Breadcrumb`
- current app and principal status in the shell
- a dedicated content region for route-specific pages

The shell should feel consistent across:

- `/portal`
- `/portal/dashboards`
- `/portal/dashboards/[dashboardId]`

### Navigation

The left sidebar should prioritize the Portal’s core control surfaces:

- Overview
- Dashboards
- Session / App context

The app switcher should move into the shell rather than living inside page content.

### Dashboard Index

The dashboards page should switch from card inventory to a denser `Table` view.

Each row should surface:

- dashboard name
- dashboard id
- embed selection state
- a compact visibility summary
- the primary action to open detail

This page is the clearest place to express “data control console” rather than “content gallery”.

### Dashboard Detail

The detail page should keep the current capabilities but express them through structured console sections:

- `Overview`
  - dashboard identity
  - embed selection state
  - quick actions
- `Sharing`
  - visible subject badges
  - add/remove subject controls
  - save action
- `Operations`
  - export/import affordances

The detail page should use either `Tabs` or a clearly segmented stacked console layout. The primary requirement is that the sections read as operational surfaces, not disconnected cards.

## Component Strategy

The redesign should prefer source-added `shadcn/ui` components over custom layout markup wherever possible.

The target stack should include:

- `Sidebar`
- `Breadcrumb`
- `Table`
- `Tabs`
- `Sheet` or `Dialog` where overlays make sense
- `Alert`
- `Badge`
- `Card`
- `Separator`
- `Skeleton`

The Portal should continue using `Button`, `Input`, `Select`, and `Dialog`, but the surrounding composition should move closer to the `shadcn` patterns:

- shell chrome from `Sidebar`
- row-oriented data surfaces from `Table`
- better page hierarchy from `Breadcrumb` + header actions
- loading and empty states from standard components instead of plain paragraphs

## Styling Rules

The redesign should follow the `shadcn` skill guidance strictly:

- use semantic colors instead of custom raw utility colors in component-level markup
- use variants before custom class styling
- use `gap-*` instead of `space-*`
- keep `className` focused on layout and placement, not per-component restyling
- use existing component composition rather than styled `div` substitutes

The global theme may still keep a Canvas identity, but it should support the `shadcn` component language rather than fight it.

## File Boundaries

### Shell and Layout

- `apps/web/src/app/portal/layout.tsx`
- `apps/web/src/components/portal/portal-shell.tsx`
- `apps/web/src/components/portal/app-switcher.tsx`

### Dashboard Console

- `apps/web/src/app/portal/dashboards/page.tsx`
- `apps/web/src/app/portal/dashboards/[dashboardId]/page.tsx`
- `apps/web/src/components/portal/dashboard-list.tsx`
- `apps/web/src/components/portal/dashboard-editor.tsx`
- `apps/web/src/components/portal/dashboard-share-panel.tsx`

### UI Foundation

- `apps/web/src/components/ui/*`
- `apps/web/src/app/globals.css`

Additional `shadcn` components may be added to `components/ui` if they are required by the redesign and can be justified by reuse or better composition.

## Testing Strategy

This redesign should continue using focused render and route tests.

The key checks are:

- authenticated shell renders persistent console navigation
- login page remains usable
- dashboard index renders console-like management surfaces
- dashboard detail renders clearly separated operational sections
- app switching still works
- share and embed actions still call the same APIs

Because this is primarily a UI/IA redesign, tests should assert for:

- correct structural labels
- navigation presence
- action affordances
- integration continuity

They do not need to snapshot raw HTML or overfit exact class names.

## Risks and Mitigations

### Risk: “Replace all components with shadcn” turns into a visual reskin only

Mitigation:

- redesign shell and IA, not just individual controls
- replace card-heavy inventory with `Table`
- move app switching into console navigation

### Risk: too much visual customization weakens `shadcn` consistency

Mitigation:

- prefer stock component variants
- keep custom styling at the theme and layout layer
- avoid bespoke component-level colors and bespoke status chips when `Badge`, `Alert`, and `Table` variants can do the work

### Risk: the redesign grows into a full product rethink

Mitigation:

- keep routes and backend contracts unchanged
- preserve current user journey
- treat this work as “presentation and composition overhaul”, not feature expansion
