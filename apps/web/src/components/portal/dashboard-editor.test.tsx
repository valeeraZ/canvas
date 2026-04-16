import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { DashboardEditor } from "./dashboard-editor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

describe("DashboardEditor", () => {
  it("renders a management view for one dashboard", () => {
    const html = renderToString(
      <DashboardEditor
        dashboard={{ id: "dash_1", name: "Executive Overview" }}
        selectedDashboardId="dash_1"
        widgets={[
          {
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
            sampleRows: [{ month: "Jan", revenue: 120 }],
            records: [{ month: "Jan", revenue: 120 }]
          }
        }}
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
    expect(html).toContain("Active chart");
    expect(html).toContain("Configure widget");
    expect(html).toContain("Real data chart preview for the selected widget.");
    expect(html).toContain("Selected for embed");
    expect(html).toContain("Export dashboard");
    expect(html).toContain("Revenue by month");
    expect(html).toContain("Series split coming later");
  });

  it("disables add chart when no datasets are available", () => {
    const html = renderToString(
      <DashboardEditor
        dashboard={{ id: "dash_1", name: "Executive Overview" }}
        selectedDashboardId={null}
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
