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

describe("PortalAppDatasetsPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
  });

  it("renders datasets for the app-scoped route", async () => {
    const session = Buffer.from(
      JSON.stringify({
        token: "local-dev-token",
        selectedApp: "frame_app",
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
          },
          {
            appName: "sales_ops",
            appDisplayName: "Sales Ops",
            appLogoName: "database",
            roles: ["EDITOR"]
          }
        ]
      }),
      listDatasets: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: "ds_1",
            tenantId: "frame_app",
            name: "Sales Upload",
            status: "ready",
            warningCount: 0,
            uploadedByDisplayName: "Local Dev",
            uploadedByExternalUserId: "dev-1"
          }
        ])
        .mockResolvedValueOnce([
          {
            id: "ds_2",
            tenantId: "sales_ops",
            name: "Pipeline Upload",
            status: "queued",
            warningCount: 1,
            uploadedByDisplayName: "Avery",
            uploadedByExternalUserId: "emp-22"
          }
        ])
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
    expect(html).toContain("Sales Upload");
    expect(html).toContain("Pipeline Upload");
    expect(html).toContain("Local Dev (dev-1)");
    expect(html).toContain("Avery (emp-22)");
    expect(html).toContain("/portal/frame_app/datasets/ds_1");
    expect(html).toContain("/portal/sales_ops/datasets/ds_2");
  });
});
