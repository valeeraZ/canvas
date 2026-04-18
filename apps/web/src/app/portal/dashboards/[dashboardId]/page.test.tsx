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

  it("renders dashboard preview by default and falls back when auxiliary requests fail", async () => {
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
      listDashboardWidgets: async () => [
        {
          id: "widget_1",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          config: {
            datasetId: "ds_1",
            chartType: "bar",
            xField: "month",
            yField: "revenue",
            title: "Revenue by month"
          }
        }
      ],
      listDatasets: async () => [],
      getDataset: async () => ({
        id: "ds_1",
        tenantId: "canvas",
        name: "Sales Upload",
        status: "ready",
        sourceFilename: "sales.csv"
      }),
      getDatasetPreview: async () => null
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>
        {await module.default({
          params: Promise.resolve({
            dashboardId: "dash_1"
          }),
          searchParams: Promise.resolve({})
        })}
      </TooltipProvider>
    );

    expect(html).toContain("Executive Overview");
    expect(html).toContain("Review embed selection");
    expect(html).toContain("Edit dashboard");
    expect(html).toContain("/portal/dashboards/dash_1?mode=edit");
    expect(html).toContain("Revenue by month");
    expect(html).toContain("Sales Upload");
    expect(html).toContain("sales.csv");
    expect(html).not.toContain("Configure widget");
    expect(html).not.toContain("Preview dashboard");
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it("renders editor only when mode=edit is requested", async () => {
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
            dashboardId: "dash_1"
          }),
          searchParams: Promise.resolve({
            mode: "edit"
          })
        })}
      </TooltipProvider>
    );

    expect(html).toContain("Configure widget");
    expect(html).toContain("Dashboard canvas");
    expect(html).not.toContain("Preview dashboard");
  });
});
