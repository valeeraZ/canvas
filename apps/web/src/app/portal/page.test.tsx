import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { TooltipProvider } from "../../components/ui/tooltip";

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("PortalHomePage", () => {
  beforeEach(() => {
    cookiesMock.mockReset();
  });

  it("renders a login call-to-action when no portal session exists", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined
    });

    const module = await import("./page");
    const html = renderToString(
      <TooltipProvider>{await module.default()}</TooltipProvider>
    );

    expect(html).toContain("Sign in to Canvas");
    expect(html).toContain("/portal/login");
  });

  it("renders console navigation when a portal session exists", async () => {
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
    const html = renderToString(
      <TooltipProvider>{await module.default()}</TooltipProvider>
    );

    expect(html).toContain("Console navigation");
    expect(html).toContain("Dashboards");
    expect(html).toContain("Session context");
  });
});
