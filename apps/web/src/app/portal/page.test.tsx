import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../components/ui/tooltip";

const cookiesMock = vi.fn();
const createPortalBackendClientMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

vi.mock("../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalHomePage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
  });

  it("renders a login call-to-action when no portal session exists", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>{await module.default()}</TooltipProvider>
    );

    expect(html).toContain("Sign in to Canvas");
    expect(html).toContain("/portal/login");
  });

  it("renders the accessible app inventory ordered by recent usage", async () => {
    const session = Buffer.from(
      JSON.stringify({
        token: "local-dev-token",
        selectedApp: "canvas",
        recentApps: ["canvas-ops", "canvas"],
        recentDashboardsByApp: {
          "canvas-ops": "ops-dash"
        },
        recentWorkbooksByApp: {
          "canvas-ops": "ops-book"
        },
        principal: {
          displayName: "Local Dev",
          employeeId: "dev-1",
          roles: ["ADMIN"]
        }
      }),
      "utf8"
    ).toString("base64url");

    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "canvas_portal_session" ? { value: session } : undefined
    });
    createPortalBackendClientMock.mockImplementation((input: {
      selectedApp: string;
    }) => ({
      listAccessibleApps: async () => ({
        principal: {
          displayName: "Local Dev",
          employeeId: "dev-1"
        },
        apps: [
          {
            appName: "canvas",
            roles: ["ADMIN"]
          },
          {
            appName: "canvas-ops",
            roles: ["USER"]
          }
        ]
      }),
      listDashboards: async () =>
        input.selectedApp === "canvas-ops"
          ? [
              {
                id: "ops-dash",
                tenantId: "canvas-ops",
                name: "Ops Overview",
                workbookId: "ops-book"
              }
            ]
          : [
              {
                id: "core-dash",
                tenantId: "canvas",
                name: "Core Overview",
                workbookId: "core-book"
              }
            ],
      listWorkbooks: async () =>
        input.selectedApp === "canvas-ops"
          ? [
              {
                id: "ops-book",
                tenantId: "canvas-ops",
                name: "Operations Workbook"
              }
            ]
          : [
              {
                id: "core-book",
                tenantId: "canvas",
                name: "Core Workbook"
              }
            ]
    }));

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>{await module.default()}</TooltipProvider>
    );

    expect(html).toContain("Your apps");
    expect(html).toContain("Operations Workbook");
    expect(html).toContain("Ops Overview");
    expect(html).not.toContain("Session context");
    expect(html.indexOf("Ops Overview")).toBeLessThan(
      html.indexOf("Core Overview")
    );
  });
});
