import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardBuilder } from "./dashboard-builder";

describe("DashboardBuilder", () => {
  it("renders the v1 widget choices", () => {
    const html = renderToString(<DashboardBuilder />);

    expect(html).toContain("chart");
    expect(html).toContain("table");
    expect(html).toContain("metric");
    expect(html).toContain("text");
  });
});
