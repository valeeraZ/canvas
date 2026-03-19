import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import Page from "./page";

describe("embed demo page", () => {
  it("renders the canvas demo heading", () => {
    const html = renderToString(<Page />);

    expect(html).toContain("Canvas Embed Demo");
    expect(html).toContain("Simulate Login");
    expect(html).toContain("Run Ingestion Demo");
  });
});
