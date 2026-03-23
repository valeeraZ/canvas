import React from "react";

export function DashboardList(props: {
  dashboards: Array<{
    id: string;
    name: string;
  }>;
  selectedDashboardId: string | null;
}) {
  return (
    <section>
      <h2>Dashboards</h2>
      <ul>
        {props.dashboards.map((dashboard) => (
          <li key={dashboard.id}>
            <strong>{dashboard.name}</strong>
            {dashboard.id === props.selectedDashboardId ? (
              <span> Selected for Embed</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
