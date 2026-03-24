import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { AppSwitcher } from "./app-switcher";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("AppSwitcher", () => {
  it("renders a real app switching control", () => {
    const html = renderToString(
      <AppSwitcher apps={["canvas", "canvas-ops"]} currentApp="canvas" />
    );

    expect(html).toContain("Active Canvas app");
    expect(html).toContain("Switch active app");
    expect(html).toContain("Update");
  });
});
