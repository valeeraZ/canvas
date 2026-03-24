import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

const cookiesMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock
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
    const html = renderToString(await module.default());

    expect(html).toContain("Sign in to Canvas");
    expect(html).toContain("/portal/login");
  });
});
