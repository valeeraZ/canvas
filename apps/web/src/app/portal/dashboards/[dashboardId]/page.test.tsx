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
  notFound: notFoundMock,
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  })
}));

vi.mock("../../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalDashboardDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
    notFoundMock.mockReset();
  });

  it("renders dashboard detail even when auxiliary backend requests fail", async () => {
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
        apps: [{ appName: "canvas", roles: ["ADMIN"] }]
      }),
      getDashboard: async () => ({
        id: "dash_1",
        tenantId: "canvas",
        name: "Executive Overview",
        workbookId: null
      }),
      getSelectedDashboard: async () => {
        throw new Error("selected dashboard failed");
      },
      getDashboardShare: async () => {
        throw new Error("share failed");
      },
      listDashboardWidgets: async () => {
        throw new Error("widgets failed");
      },
      listDatasets: async () => {
        throw new Error("datasets failed");
      },
      getDatasetPreview: async () => null
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>
        {await module.default({
          params: Promise.resolve({
            dashboardId: "dash_1"
          })
        })}
      </TooltipProvider>
    );

    expect(html).toContain("Executive Overview");
    expect(html).toContain("Review embed selection");
    expect(html).toContain("Add the first chart widget");
    expect(html).toContain("Active chart");
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
