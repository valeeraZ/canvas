import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../../../components/ui/tooltip";

const cookiesMock = vi.fn();
const createPortalBackendClientMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    push: vi.fn()
  }),
  notFound: vi.fn()
}));

vi.mock("../../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalWorkbookDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
  });

  it("renders workbook detail with related dashboards", async () => {
    const session = Buffer.from(
      JSON.stringify({
        token: "local-dev-token",
        selectedApp: "canvas",
        recentApps: ["canvas"],
        recentDashboardsByApp: {},
        recentWorkbooksByApp: {},
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
      getWorkbook: async () => ({
        id: "wb_1",
        tenantId: "canvas",
        name: "Executive Workbook"
      }),
      listWorkbooks: async () => [
        {
          id: "wb_1",
          tenantId: "canvas",
          name: "Executive Workbook"
        }
      ],
      listDashboards: async () => [
        {
          id: "dash_1",
          tenantId: "canvas",
          name: "Executive Overview",
          workbookId: "wb_1"
        },
        {
          id: "dash_2",
          tenantId: "canvas",
          name: "Ops Snapshot",
          workbookId: null
        }
      ]
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>
        {await module.default({
          params: Promise.resolve({
            workbookId: "wb_1"
          })
        })}
      </TooltipProvider>
    );

    expect(html).toContain("Executive Workbook");
    expect(html).toContain("Executive Overview");
    expect(html).toContain("Create dashboard");
  });
});
