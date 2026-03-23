import React from "react";
import type { VisibleDashboard } from "../../../../../contracts/src/embed-viewer";

export function DashboardPicker(props: {
  dashboards: VisibleDashboard[];
  selectedDashboardId: string | null;
  onSelect: (dashboardId: string) => void;
}) {
  return (
    <section>
      <h3>My Dashboards</h3>
      <ul>
        {props.dashboards.map((dashboard) => (
          <li key={dashboard.id}>
            <button
              type="button"
              onClick={() => props.onSelect(dashboard.id)}
              disabled={dashboard.id === props.selectedDashboardId}
            >
              {dashboard.name}
            </button>
            {dashboard.id === props.selectedDashboardId ? <span> Selected</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
