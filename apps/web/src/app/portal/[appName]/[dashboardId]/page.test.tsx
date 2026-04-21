import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../../../components/ui/tooltip";

const cookiesMock = vi.fn();
const createPortalBackendClientMock = vi.fn();
const notFoundMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock
}));

vi.mock("../../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalScopedDashboardDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
    notFoundMock.mockReset();
  });

  it("renders dashboard detail for the app in the route and links edit mode within that app", async () => {
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
      getDashboard: async () => ({
        id: "dash_1",
        tenantId: "frame_app",
        name: "Executive Overview",
        workbookId: null
      }),
      getSelectedDashboard: async () => ({
        dashboardId: "dash_1"
      }),
      getDashboardShare: async () => ({
        dashboardId: "dash_1",
        subjects: [],
        rules: []
      }),
      listDashboardWidgets: async () => [],
      listDatasets: async () => [],
      getDataset: async () => null,
      getDatasetPreview: async () => null
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>
        {await module.default({
          params: Promise.resolve({
            appName: "frame_app",
            dashboardId: "dash_1"
          }),
          searchParams: Promise.resolve({})
        })}
      </TooltipProvider>
    );

    expect(html).toContain("FRAME App");
    expect(html).toContain("Executive Overview");
    expect(html).toContain("/portal/frame_app/dash_1?mode=edit");
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
