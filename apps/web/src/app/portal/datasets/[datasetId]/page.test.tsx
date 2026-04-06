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

describe("PortalDatasetDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    createPortalBackendClientMock.mockReset();
  });

  it("renders dataset metadata and usage", async () => {
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
      getDataset: async () => ({
        id: "ds_1",
        name: "Sales Upload",
        status: "queued",
        uploadedByDisplayName: "Local Dev",
        sourceFilename: "sales.csv",
        contentType: "text/csv",
        sizeBytes: 256,
        importStatus: "queued",
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
            datasetId: "ds_1"
          })
        })}
      </TooltipProvider>
    );

    expect(html).toContain("Sales Upload");
    expect(html).toContain("Local Dev");
    expect(html).toContain("Executive Overview");
  });
});
