import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import {
  areChartWidgetConfigsEqual,
  DashboardWidgetConfigPanel,
  buildDatasetConfigUpdate,
  CONFIG_PANEL_GROUPS,
  shouldResetWidgetConfigDraft,
  WIDGET_TITLE_AUTOSAVE_DELAY_MS
} from "./dashboard-widget-config-panel";

describe("DashboardWidgetConfigPanel", () => {
  it("renders grouped sections and removes the explicit save button", () => {
    const html = renderToString(
      <DashboardWidgetConfigPanel
        widget={{
          id: "widget_1",
          tenantId: "canvas",
          dashboardId: "dash_1",
          type: "chart",
          datasetId: "ds_1",
          config: {
            datasetId: "ds_1",
            chartType: "bar",
            xField: "month",
            yField: "revenue",
            title: "Revenue by month"
          }
        }}
        datasets={[{ id: "ds_1", name: "Sales Upload", status: "ready" }]}
        previews={{
          ds_1: {
            datasetId: "ds_1",
            columns: [
              { name: "month", type: "string" },
              { name: "revenue", type: "number" }
            ],
            sampleRows: [{ month: "Jan", revenue: 120 }],
            records: [{ month: "Jan", revenue: 120 }]
          }
        }}
        pending={false}
        onSave={() => {}}
      />
    );

    expect(CONFIG_PANEL_GROUPS).toEqual(["Chart", "Data", "Meta"]);
    expect(html).toContain("Chart");
    expect(html).toContain("Data");
    expect(html).toContain("Meta");
    expect(html).not.toContain("Save widget");
  });

  it("derives a valid dataset-driven config update for immediate auto-save", () => {
    expect(buildDatasetConfigUpdate).toBeTypeOf("function");
    expect(WIDGET_TITLE_AUTOSAVE_DELAY_MS).toBeGreaterThan(0);

    const next = buildDatasetConfigUpdate({
      current: {
        datasetId: "ds_1",
        chartType: "bar",
        xField: "month",
        yField: "revenue",
        title: "Revenue by month"
      },
      datasetId: "ds_2",
      preview: {
        datasetId: "ds_2",
        columns: [
          { name: "day", type: "string" },
          { name: "profit", type: "number" }
        ],
        sampleRows: [{ day: "Mon", profit: 8 }],
        records: [{ day: "Mon", profit: 8 }]
      }
    });

    expect(next).toEqual({
      datasetId: "ds_2",
      chartType: "bar",
      xField: "day",
      yField: "profit",
      title: "Revenue by month"
    });
  });

  it("treats equivalent chart configs as equal to avoid draft reset loops", () => {
    expect(
      areChartWidgetConfigsEqual(
        {
          datasetId: "ds_1",
          chartType: "line",
          xField: "month",
          yField: "revenue",
          title: "Revenue"
        },
        {
          datasetId: "ds_1",
          chartType: "line",
          xField: "month",
          yField: "revenue",
          title: "Revenue"
        }
      )
    ).toBe(true);
  });

  it("does not request a draft reset when the incoming widget config is equivalent", () => {
    const widget = {
      id: "widget_1",
      tenantId: "canvas",
      dashboardId: "dash_1",
      type: "chart" as const,
      datasetId: "ds_1",
      layout: {
        x: 0,
        y: 0,
        w: 1,
        h: 1
      },
      config: {
        datasetId: "ds_1",
        chartType: "bar" as const,
        xField: "month",
        yField: "revenue",
        title: "Revenue by month"
      }
    };

    expect(
      shouldResetWidgetConfigDraft({
        currentDraft: {
          datasetId: "ds_1",
          chartType: "bar",
          xField: "month",
          yField: "revenue",
          title: "Revenue by month"
        },
        widget: {
          ...widget,
          config: {
            ...widget.config
          }
        },
        datasets: [{ id: "ds_1", name: "Sales Upload", status: "ready" }],
        previews: {
          ds_1: {
            datasetId: "ds_1",
            columns: [
              { name: "month", type: "string" },
              { name: "revenue", type: "number" }
            ],
            sampleRows: [{ month: "Jan", revenue: 120 }],
            records: [{ month: "Jan", revenue: 120 }]
          }
        }
      })
    ).toBe(false);
  });
});
