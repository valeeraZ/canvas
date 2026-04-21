import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../../components/ui/tooltip";

const cookiesMock = vi.fn();
const createPortalBackendClientMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  })
}));

vi.mock("../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalAppDashboardsPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
  });

  it("renders dashboards for the app in the route and shows app breadcrumbs", async () => {
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

    createPortalBackendClientMock.mockReturnValue({
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
          }
        ]
      }),
      listDashboards: async () => [
        {
          id: "dash_1",
          tenantId: "frame_app",
          name: "Executive Overview",
          workbookId: null
        }
      ],
      getSelectedDashboard: async () => ({
        dashboardId: "dash_1"
      })
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>
        {await module.default({
          params: Promise.resolve({
            appName: "frame_app"
          })
        })}
      </TooltipProvider>
    );

    expect(html).toContain("FRAME App");
    expect(html).toContain("Executive Overview");
    expect(html).toContain("/portal/frame_app/dash_1");
    expect(html).toContain("Portal");
  });
});
