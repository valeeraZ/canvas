import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../../components/ui/tooltip";

const cookiesMock = vi.fn();
const createPortalBackendClientMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  })
}));

vi.mock("../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalDashboardsPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
    redirectMock.mockReset();
  });

  it("renders dashboards across accessible apps instead of redirecting to the active app", async () => {
    const session = Buffer.from(
      JSON.stringify({
        token: "local-dev-token",
        selectedApp: "canvas",
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
            appName: "frame_app",
            appDisplayName: "FRAME App",
            appLogoName: "app-window",
            roles: ["ADMIN"]
          },
          {
            appName: "ops_app",
            appDisplayName: "Ops App",
            appLogoName: "app-window",
            roles: ["USER"]
          }
        ]
      }),
      listDashboards: async () =>
        input.selectedApp === "ops_app"
          ? [
              {
                id: "dash_ops",
                tenantId: "ops_app",
                name: "Ops Overview",
                workbookId: null,
                status: "active",
                author: {
                  externalUserId: "dev-1",
                  displayName: "Local Dev"
                },
                createdAt: "2026-04-21T09:00:00.000Z",
                updatedAt: "2026-04-21T10:00:00.000Z"
              }
            ]
          : [
              {
                id: "dash_frame",
                tenantId: "frame_app",
                name: "Executive Overview",
                workbookId: null,
                status: "active",
                author: {
                  externalUserId: "dev-2",
                  displayName: "Ada Lovelace"
                },
                createdAt: "2026-04-20T09:00:00.000Z",
                updatedAt: "2026-04-20T10:00:00.000Z"
              }
            ],
      getSelectedDashboard: async () => ({
        dashboardId: input.selectedApp === "ops_app" ? "dash_ops" : null
      })
    }));

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>{await module.default()}</TooltipProvider>
    );

    expect(redirectMock).not.toHaveBeenCalled();
    expect(html).toContain("Dashboards");
    expect(html).toContain("Executive Overview");
    expect(html).toContain("Ops Overview");
    expect(html).toContain("FRAME App");
    expect(html).toContain("Ops App");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("/portal/frame_app/dash_frame");
    expect(html).toContain("Create dashboard");
  });
});
