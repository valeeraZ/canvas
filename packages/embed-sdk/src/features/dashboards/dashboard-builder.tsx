import React from "react";
import { WidgetConfigPanel } from "./widget-config-panel";
import { WidgetPicker } from "./widget-picker";

export function DashboardBuilder() {
  return (
    <section>
      <WidgetPicker />
      <WidgetConfigPanel />
    </section>
  );
}
