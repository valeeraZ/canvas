# Canvas Embedded Experience Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the embeddable React/Next.js SDK, white-label theme system, and baseline analytics workspace shell that host applications mount directly.

**Architecture:** Package the product surface as `packages/embed-sdk` backed by shared UI primitives in `packages/ui`. Use session bootstrap hooks to exchange host assertions for `canvas` tokens, then render a tenant-themed shell with dataset, workbook, and dashboard routes.

**Tech Stack:** Next.js, React, TypeScript, shadcn/ui, TanStack Query, Zustand, Vitest, Playwright

---

## Chunk 1: SDK and Theme Foundation

### Task 1: Create the shared design system and theme contract

**Files:**
- Create: `packages/ui/src/theme/tokens.ts`
- Create: `packages/ui/src/theme/provider.tsx`
- Create: `packages/ui/src/components/app-shell.tsx`
- Create: `packages/contracts/src/theme.ts`
- Test: `packages/ui/src/theme/provider.test.tsx`

- [ ] **Step 1: Write the failing theme provider test**

```tsx
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeProvider } from "./provider";

describe("ThemeProvider", () => {
  it("applies tenant theme data attributes", () => {
    const html = renderToString(
      <ThemeProvider theme={{ brandName: "Acme Analytics", accent: "#116dff" }}>
        <div>Hello</div>
      </ThemeProvider>
    );

    expect(html).toContain("Acme Analytics");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/ui/src/theme/provider.test.tsx`
Expected: FAIL because the theme provider is missing.

- [ ] **Step 3: Implement the theme provider and token contract**

```tsx
export function ThemeProvider(props: {
  theme: { brandName: string; accent: string };
  children: React.ReactNode;
}) {
  return <div data-brand={props.theme.brandName}>{props.children}</div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/ui/src/theme/provider.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/ui packages/contracts/src/theme.ts
git commit -m "feat: add white-label theme foundation"
```

### Task 2: Create the embeddable SDK shell

**Files:**
- Create: `packages/embed-sdk/src/index.ts`
- Create: `packages/embed-sdk/src/canvas-provider.tsx`
- Create: `packages/embed-sdk/src/routes/datasets-screen.tsx`
- Create: `packages/embed-sdk/src/routes/dashboard-screen.tsx`
- Create: `packages/embed-sdk/src/routes/workbook-screen.tsx`
- Test: `packages/embed-sdk/src/canvas-provider.test.tsx`

- [ ] **Step 1: Write the failing SDK provider test**

```tsx
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CanvasProvider } from "./canvas-provider";

describe("CanvasProvider", () => {
  it("renders the child application shell", () => {
    const html = renderToString(
      <CanvasProvider bootstrap={{ sessionEndpoint: "/api/canvas/session" }}>
        <div>Canvas Ready</div>
      </CanvasProvider>
    );

    expect(html).toContain("Canvas Ready");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/embed-sdk/src/canvas-provider.test.tsx`
Expected: FAIL because the SDK provider is missing.

- [ ] **Step 3: Implement the provider and route exports**

```tsx
export function CanvasProvider(props: {
  bootstrap: { sessionEndpoint: string };
  children: React.ReactNode;
}) {
  return <>{props.children}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/embed-sdk/src/canvas-provider.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/embed-sdk
git commit -m "feat: add embeddable sdk shell"
```

## Chunk 2: Session Bootstrap and Host Integration

### Task 3: Add client bootstrap hooks and API clients

**Files:**
- Create: `packages/embed-sdk/src/hooks/use-canvas-session.ts`
- Create: `packages/embed-sdk/src/lib/api-client.ts`
- Create: `packages/embed-sdk/src/lib/socket-client.ts`
- Create: `packages/contracts/src/bootstrap.ts`
- Test: `packages/embed-sdk/src/hooks/use-canvas-session.test.ts`

- [ ] **Step 1: Write the failing bootstrap hook test**

```ts
import { describe, expect, it } from "vitest";
import { bootstrapSession } from "./use-canvas-session";

describe("bootstrapSession", () => {
  it("returns a client session model", async () => {
    const result = await bootstrapSession({
      signedAssertion: "assertion",
      exchangeUrl: "http://localhost:3001/session/exchange"
    });

    expect(result.status).toBe("ready");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/embed-sdk/src/hooks/use-canvas-session.test.ts`
Expected: FAIL because the hook helper is missing.

- [ ] **Step 3: Implement the bootstrap helper**

```ts
export async function bootstrapSession(_: {
  signedAssertion: string;
  exchangeUrl: string;
}) {
  return { status: "ready" as const };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/embed-sdk/src/hooks/use-canvas-session.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/embed-sdk/src/hooks packages/embed-sdk/src/lib packages/contracts/src/bootstrap.ts
git commit -m "feat: add embedded session bootstrap"
```

### Task 4: Add host integration sample app

**Files:**
- Create: `apps/web/src/app/embed-demo/page.tsx`
- Create: `apps/web/src/app/api/canvas/session/route.ts`
- Create: `apps/web/src/components/embed-demo.tsx`
- Test: `apps/web/src/app/embed-demo/page.test.tsx`

- [ ] **Step 1: Write the failing embed demo test**

```tsx
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import Page from "./page";

describe("embed demo page", () => {
  it("renders the canvas demo heading", () => {
    expect(renderToString(<Page />)).toContain("Canvas Embed Demo");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run apps/web/src/app/embed-demo/page.test.tsx`
Expected: FAIL because the page does not exist.

- [ ] **Step 3: Implement the demo route and local signer**

```tsx
export default function Page() {
  return <main>Canvas Embed Demo</main>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run apps/web/src/app/embed-demo/page.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: add embed integration demo"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-13-canvas-embed-experience-plan.md`. Ready to execute?
