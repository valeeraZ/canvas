import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
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

describe("PortalDashboardDetailPage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    redirectMock.mockReset();
  });

  it("redirects legacy dashboard detail URLs to the app-scoped route", async () => {
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

    const module = await import("./page");
    await module.default({
      params: Promise.resolve({
        dashboardId: "dash_1"
      }),
      searchParams: Promise.resolve({})
    });

    expect(redirectMock).toHaveBeenCalledWith("/portal/canvas/dash_1");
  });

  it("preserves edit mode when redirecting legacy URLs", async () => {
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

    const module = await import("./page");
    await module.default({
      params: Promise.resolve({
        dashboardId: "dash_1"
      }),
      searchParams: Promise.resolve({
        mode: "edit"
      })
    });

    expect(redirectMock).toHaveBeenCalledWith("/portal/canvas/dash_1?mode=edit");
  });
});
