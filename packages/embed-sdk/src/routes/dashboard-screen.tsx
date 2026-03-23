import React from "react";
import type { VisibleDashboard } from "../../../contracts/src/embed-viewer";
import { DashboardPicker } from "../features/dashboards/dashboard-picker";

export function DashboardScreen(props: {
  dashboards?: VisibleDashboard[];
  selectedDashboardId?: string | null;
  onSelect?: (dashboardId: string) => void;
}) {
  return (
    <DashboardPicker
      dashboards={props.dashboards ?? []}
      selectedDashboardId={props.selectedDashboardId ?? null}
      onSelect={props.onSelect ?? (() => undefined)}
    />
  );
}
