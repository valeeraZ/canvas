import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";

describe("DashboardPreview", () => {
  it("renders widget type and dataset metadata inline in read-only mode", async () => {
    const module = await import("./dashboard-preview").catch(() => ({
      DashboardPreview: null
    }));

    expect(module.DashboardPreview).toBeTypeOf("function");

    const html = renderToString(
      <module.DashboardPreview
        dashboardId="dash_1"
        widgets={[
          {
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: {
              x: 0,
              y: 0,
              w: 1,
              h: 1
            },
            config: {
              datasetId: "ds_1",
              chartType: "bar",
              xField: "month",
              yField: "revenue",
              title: "Revenue by month"
            }
          }
        ]}
        datasetDetails={{
          ds_1: {
            id: "ds_1",
            name: "Sales Upload",
            sourceFilename: "sales.csv"
          }
        }}
      />
    );

    expect(html).not.toContain("Preview dashboard");
    expect(html).toContain("Sales Upload");
    expect(html).toContain("sales.csv");
    expect(html).toContain("bar");
    expect(html).toContain("/portal/datasets/ds_1");
    expect(html).not.toContain("Configure widget");
    expect(html).not.toContain("Editing");
    expect(html).not.toContain("Drag widget");
    expect(html).not.toContain("Delete widget");
  });

  it("shows a fallback when a widget has no linked dataset metadata", async () => {
    const module = await import("./dashboard-preview").catch(() => ({
      DashboardPreview: null
    }));

    const html = renderToString(
      <module.DashboardPreview
        dashboardId="dash_1"
        widgets={[
          {
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: null,
            layout: {
              x: 0,
              y: 0,
              w: 1,
              h: 1
            },
            config: null
          }
        ]}
        datasetDetails={{}}
        chartStates={{
          widget_1: {
            status: "idle"
          }
        }}
      />
    );

    expect(html).toContain("No dataset linked");
  });

  it("starts table charts in loading state when preview metadata is ready", async () => {
    const module = await import("./dashboard-preview").catch(() => ({
      DashboardPreview: null
    }));

    const html = renderToString(
      <module.DashboardPreview
        dashboardId="dash_1"
        widgets={[
          {
            id: "widget_1",
            tenantId: "canvas",
            dashboardId: "dash_1",
            type: "chart",
            datasetId: "ds_1",
            layout: {
              x: 0,
              y: 0,
              w: 2,
              h: 1
            },
            config: {
              datasetId: "ds_1",
              chartType: "table",
              columns: ["month", "revenue"],
              pageSize: 10,
              title: "Sales rows"
            }
          }
        ]}
        datasets={[
          {
            id: "ds_1",
            name: "Sales Upload",
            status: "ready"
          }
        ]}
        datasetPreviews={{
          ds_1: {
            datasetId: "ds_1",
            columns: [
              { name: "month", type: "string" },
              { name: "revenue", type: "number" }
            ],
            sampleRows: []
          }
        }}
        datasetDetails={{
          ds_1: {
            id: "ds_1",
            name: "Sales Upload",
            sourceFilename: "sales.csv"
          }
        }}
      />
    );

    expect(html).toContain("Loading table...");
    expect(html).not.toContain("Configure a dataset and table columns to render this widget.");
  });
});
