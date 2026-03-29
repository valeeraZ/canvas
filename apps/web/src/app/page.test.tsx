import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

describe("HomePage", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    globalThis.React = React;
  });

  it("redirects to the portal entrypoint", async () => {
    const module = await import("./page");

    await module.default();

    expect(redirectMock).toHaveBeenCalledWith("/portal");
  });
});
