import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardBuilderShell } from "./dashboard-builder-shell";

describe("DashboardBuilderShell", () => {
  it("renders add widget and configure controls", () => {
    const html = renderToString(<DashboardBuilderShell />);

    expect(html).toContain("Add Widget");
    expect(html).toContain("Configure");
  });
});
