import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CanvasProvider } from "./canvas-provider";

describe("CanvasProvider", () => {
  it("renders the child application shell", () => {
    const html = renderToString(
      <CanvasProvider bootstrap={{ sessionEndpoint: "/api/canvas/session" }}>
        <div>Canvas Ready</div>
      </CanvasProvider>
    );

    expect(html).toContain("Canvas Ready");
  });
});
