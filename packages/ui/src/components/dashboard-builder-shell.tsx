import React from "react";
import { DashboardGrid } from "./dashboard-grid";
import { WidgetConfigPanel } from "./widget-config-panel";
import { WidgetPicker } from "./widget-picker";

export function DashboardBuilderShell() {
  return (
    <section>
      <WidgetPicker
        widgetTypes={["chart", "table", "metric", "text"]}
        onSelect={() => undefined}
      />
      <DashboardGrid />
      <WidgetConfigPanel />
    </section>
  );
}
