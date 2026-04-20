import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import {
  applyWidgetConfigDrafts,
  applyWidgetLayoutSwap,
  buildWidgetChartStateEntries,
  DashboardEditor,
  resolveDeletedWidgetFocus,
  reuseChartState
} from "./dashboard-editor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("DashboardEditor", () => {
  const datasets = [
    {
      id: "ds_1",
      name: "Sales Upload",
      status: "ready"
    }
  ];

  const datasetPreviews = {
    ds_1: {
      datasetId: "ds_1",
      columns: [
        { name: "month", type: "string" as const },
        { name: "revenue", type: "number" as const },
        { name: "profit", type: "number" as const }
      ],
      sampleRows: [{ month: "Jan", revenue: 120, profit: 32 }],
      records: [{ month: "Jan", revenue: 120, profit: 32 }]
    }
  };

  function createWidgets() {
    return [
      {
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
      },
      {
        id: "widget_2",
        tenantId: "canvas",
        dashboardId: "dash_1",
        type: "chart" as const,
        datasetId: "ds_1",
        layout: {
          x: 1,
          y: 0,
          w: 1,
          h: 1
        },
        config: {
          datasetId: "ds_1",
          chartType: "line" as const,
          xField: "month",
          yField: "profit",
          title: "Margin by month"
        }
      }
    ];
  }

  it("reuses the previous chart state when the derived state is equivalent", () => {
    const current = {
      status: "loading"
    } as const;
    const next = {
      status: "loading"
    } as const;

    expect(reuseChartState(current, next)).toBe(current);
  });

  it("renders a management view for one dashboard", () => {
    const html = renderToString(
      <DashboardEditor
        dashboard={{ id: "dash_1", name: "Executive Overview" }}
        selectedDashboardId="dash_1"
        previewHref="/portal/dashboards/dash_1"
        widgets={createWidgets()}
        datasets={[...datasets]}
        datasetPreviews={datasetPreviews}
        shareSubjects={[
          { type: "role", id: "ADMIN" },
          { type: "group", id: "finance" }
        ]}
      />
    );

    expect(html).not.toContain("Executive Overview");
    expect(html).not.toContain("Back to dashboards");
    expect(html).toContain("Widgets");
    expect(html).toContain("Add chart");
    expect(html).toContain("Dashboard canvas");
    expect(html).toContain("Configure widget");
    expect(html).toContain("Review every chart widget while keeping one active edit focus.");
    expect(html).toContain("Chart");
    expect(html).toContain("Data");
    expect(html).toContain("Meta");
    expect(html).toContain("Selected for embed");
    expect(html).toContain("Export dashboard");
    expect(html).toContain("Back to preview");
    expect(html).toContain("/portal/dashboards/dash_1");
    expect(html).toContain("Revenue by month");
    expect(html).toContain("Margin by month");
    expect(html).toContain("Series split coming later");
    expect(html).toContain("Enlarge widget");
    expect(html).toContain('data-focused-widget="true"');
    expect(html).toContain('data-active-widget="true"');
    expect((html.match(/Loading chart\.\.\./g) ?? []).length).toBe(2);
    expect(html).not.toContain("Save widget");
    expect(html).not.toContain("Focused widget preview");
  });

  it("applies a config draft to only the targeted widget", () => {
    const widgets = createWidgets();

    expect(applyWidgetConfigDrafts).toBeTypeOf("function");

    const next = applyWidgetConfigDrafts(widgets, {
      widget_2: {
        ...widgets[1].config!,
        title: "Margin delta"
      }
    });

    expect(next[0]).toBe(widgets[0]);
    expect(next[1]).not.toBe(widgets[1]);
    expect(next[1].config?.title).toBe("Margin delta");
  });

  it("preserves widget array identity when no config drafts apply", () => {
    const widgets = createWidgets();

    const next = applyWidgetConfigDrafts(widgets, {});

    expect(next).toBe(widgets);
  });

  it("inserts a widget ahead of the target for optimistic drag ordering", () => {
    const widgets = [
      ...createWidgets(),
      {
        id: "widget_3",
        tenantId: "canvas",
        dashboardId: "dash_1",
        type: "chart" as const,
        datasetId: "ds_1",
        layout: {
          x: 0,
          y: 1,
          w: 1,
          h: 1
        },
        config: {
          datasetId: "ds_1",
          chartType: "area" as const,
          xField: "month",
          yField: "revenue",
          title: "Revenue trend"
        }
      }
    ];
    const next = applyWidgetLayoutSwap(widgets, "widget_3", "widget_1");

    expect(next.find((widget) => widget.id === "widget_3")?.layout).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
    expect(next.find((widget) => widget.id === "widget_1")?.layout).toEqual({
      x: 1,
      y: 0,
      w: 1,
      h: 1
    });
    expect(next.find((widget) => widget.id === "widget_2")?.layout).toEqual({
      x: 0,
      y: 1,
      w: 1,
      h: 1
    });
  });

  it("uses layout order rather than raw array order when computing drag results", () => {
    const widgets = [
      {
        id: "widget_3",
        tenantId: "canvas",
        dashboardId: "dash_1",
        type: "chart" as const,
        datasetId: "ds_1",
        layout: {
          x: 0,
          y: 1,
          w: 1,
          h: 1
        },
        config: {
          datasetId: "ds_1",
          chartType: "area" as const,
          xField: "month",
          yField: "revenue",
          title: "Revenue trend"
        }
      },
      ...createWidgets()
    ];

    const next = applyWidgetLayoutSwap(widgets, "widget_3", "widget_1");

    expect(next.find((widget) => widget.id === "widget_3")?.layout).toEqual({
      x: 0,
      y: 0,
      w: 1,
      h: 1
    });
    expect(next.find((widget) => widget.id === "widget_1")?.layout).toEqual({
      x: 1,
      y: 0,
      w: 1,
      h: 1
    });
    expect(next.find((widget) => widget.id === "widget_2")?.layout).toEqual({
      x: 0,
      y: 1,
      w: 1,
      h: 1
    });
  });

  it("moves active focus to a nearby widget after deletion", () => {
    expect(resolveDeletedWidgetFocus(createWidgets(), "widget_1")).toBe("widget_2");
    expect(resolveDeletedWidgetFocus(createWidgets(), "widget_2")).toBe("widget_1");
  });

  it("refreshes chart state only for the widget whose query changed", () => {
    const widgets = createWidgets();

    expect(buildWidgetChartStateEntries).toBeTypeOf("function");

    const current = {
      widget_1: {
        queryKey: "ds_1|bar|month|revenue",
        state: {
          status: "ready" as const,
          payload: {
            chartType: "bar" as const,
            labels: ["Jan"],
            series: [{ name: "revenue", data: [120] }]
          }
        }
      },
      widget_2: {
        queryKey: "ds_1|line|month|profit",
        state: {
          status: "ready" as const,
          payload: {
            chartType: "line" as const,
            labels: ["Jan"],
            series: [{ name: "profit", data: [32] }]
          }
        }
      }
    };

    const next = buildWidgetChartStateEntries({
      widgets: applyWidgetConfigDrafts(widgets, {
        widget_1: {
          ...widgets[0].config!,
          yField: "profit"
        }
      }),
      datasets: [...datasets],
      datasetPreviews,
      currentEntries: current
    });

    expect(next.widget_1.state.status).toBe("loading");
    expect(next.widget_1.queryKey).not.toBe(current.widget_1.queryKey);
    expect(next.widget_2).toBe(current.widget_2);
  });

  it("reuses chart entry map identity when derived loading entries are unchanged", () => {
    const widgets = applyWidgetConfigDrafts(createWidgets(), {
      widget_1: {
        datasetId: "ds_1",
        chartType: "line",
        xField: "month",
        yField: "revenue",
        title: "Revenue by month"
      }
    });

    const current = buildWidgetChartStateEntries({
      widgets,
      datasets: [...datasets],
      datasetPreviews,
      currentEntries: {}
    });

    const next = buildWidgetChartStateEntries({
      widgets,
      datasets: [...datasets],
      datasetPreviews,
      currentEntries: current
    });

    expect(next).toBe(current);
  });

  it("disables add chart when no datasets are available", () => {
    const html = renderToString(
      <DashboardEditor
        dashboard={{ id: "dash_1", name: "Executive Overview" }}
        selectedDashboardId={null}
        previewHref="/portal/dashboards/dash_1"
        widgets={[]}
        datasets={[]}
        datasetPreviews={{}}
        shareSubjects={[]}
      />
    );

    expect(html).toContain("Add chart");
    expect(html).toContain("Upload a dataset to start adding chart widgets.");
    expect(html).toContain("disabled");
  });
});
