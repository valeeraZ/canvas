import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../../../../components/ui/tooltip";

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

vi.mock("../../../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalScopedDatasetDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
  });

  it("renders dataset detail in the app-scoped route", async () => {
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
          }
        ]
      }),
      getDataset: async () => ({
        id: "ds_1",
        name: "Sales Upload",
        status: "queued",
        uploadedByDisplayName: "Local Dev",
        usageSummary: {
          dashboards: [{ id: "dash_1", name: "Executive Overview" }],
          widgets: [],
          workbooks: []
        }
      })
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>
        {await module.default({
          params: Promise.resolve({
            appName: "frame_app",
            datasetId: "ds_1"
          })
        })}
      </TooltipProvider>
    );

    expect(html).toContain("FRAME App");
    expect(html).toContain("Sales Upload");
    expect(html).toContain("/portal/frame_app/dash_1");
    expect(html).toContain("/portal/frame_app/datasets");
  });
});
