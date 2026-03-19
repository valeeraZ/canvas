import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { WidgetPicker } from "./widget-picker";

describe("WidgetPicker", () => {
  it("renders the v1 widget choices", () => {
    const html = renderToString(
      <WidgetPicker
        widgetTypes={["chart", "table", "metric", "text"]}
        onSelect={() => undefined}
      />
    );

    expect(html).toContain("chart");
    expect(html).toContain("metric");
  });
});
