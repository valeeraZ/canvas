import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../../../components/ui/tooltip";

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
  }),
  notFound: vi.fn()
}));

vi.mock("../../../../lib/portal/backend-client", () => ({
  createPortalBackendClient: createPortalBackendClientMock
}));

describe("PortalDatasetDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
    redirectMock.mockReset();
  });

  it("redirects legacy dataset detail URLs into the selected app scope", async () => {
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
        apps: [{ appName: "canvas", appDisplayName: "Canvas", appLogoName: "app-window", roles: ["ADMIN"] }]
      })
    });

    const module = await import("./page");
    await module.default({
      params: Promise.resolve({
        datasetId: "ds_1"
      })
    });

    expect(redirectMock).toHaveBeenCalledWith("/portal/canvas/datasets/ds_1");
  });

  it("redirects the legacy dataset detail route into the first accessible app when the stored selected app is stale", async () => {
    const session = Buffer.from(
      JSON.stringify({
        token: "local-dev-token",
        selectedApp: "retired-app",
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
      })
    });

    const module = await import("./page");
    await module.default({
      params: Promise.resolve({
        datasetId: "ds_1"
      })
    });

    expect(redirectMock).toHaveBeenCalledWith("/portal/frame_app/datasets/ds_1");
  });
});
