import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeProvider } from "./provider";

describe("ThemeProvider", () => {
  it("applies tenant theme data attributes", () => {
    const html = renderToString(
      <ThemeProvider theme={{ brandName: "Acme Analytics", accent: "#116dff" }}>
        <div>Hello</div>
      </ThemeProvider>
    );

    expect(html).toContain("Acme Analytics");
  });
});
