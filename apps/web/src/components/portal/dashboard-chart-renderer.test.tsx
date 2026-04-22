import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardChartRenderer } from "./dashboard-chart-renderer";

const widget = {
  id: "widget_1",
  tenantId: "canvas",
  dashboardId: "dash_1",
  type: "chart" as const,
  datasetId: "ds_1",
  config: {
    datasetId: "ds_1",
    chartType: "bar" as const,
    xField: "month",
    yField: "revenue",
    title: "Revenue by month"
  }
};

describe("DashboardChartRenderer", () => {
  it("renders loading state for the active chart", () => {
    const html = renderToString(
      <DashboardChartRenderer
        widget={widget}
        state={{ status: "loading" }}
      />
    );

    expect(html).toContain("Loading chart...");
    expect(html).toContain("Revenue by month");
  });

  it("renders shadcn chart markup for a ready chart payload", () => {
    const html = renderToString(
      <DashboardChartRenderer
        widget={widget}
        state={{
          status: "ready",
          payload: {
            chartType: "bar",
            labels: ["Jan", "Feb"],
            series: [
              {
                name: "revenue",
                data: [120, 150]
              }
            ]
          }
        }}
      />
    );

    expect(html).toContain("Revenue by month");
    expect(html).toContain("data-chart=\"dashboard-widget-chart\"");
    expect(html).toContain("revenue");
  });

  it.each(["pie", "radar", "radial"] as const)(
    "renders %s charts from the ready chart payload",
    (chartType) => {
      const html = renderToString(
        <DashboardChartRenderer
          widget={{
            ...widget,
            config: {
              ...widget.config,
              chartType
            }
          }}
          state={{
            status: "ready",
            payload: {
              chartType,
              labels: ["APAC", "EMEA"],
              series: [
                {
                  name: "revenue",
                  data: [120, 150]
                }
              ]
            }
          }}
        />
      );

      expect(html).toContain("data-chart=\"dashboard-widget-chart\"");
      expect(html).toContain(`data-chart-type="${chartType}"`);
    }
  );
});
