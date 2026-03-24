import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders the shared web shell body classes", () => {
    const html = renderToString(
      <RootLayout>
        <div>Portal</div>
      </RootLayout>
    );

    expect(html).toContain("class=\"min-h-screen");
    expect(html).toContain("bg-canvas-bg");
    expect(html).toContain("text-canvas-ink");
  });
});
