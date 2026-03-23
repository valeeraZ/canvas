import React from "react";
import { DashboardExportButton } from "./dashboard-export-button";
import { DashboardImportDialog } from "./dashboard-import-dialog";
import { DashboardSharePanel } from "./dashboard-share-panel";

export function DashboardEditor(props: {
  dashboard: {
    id: string;
    name: string;
  };
  selectedDashboardId: string | null;
  shareSubjects: Array<{
    type: "user" | "group" | "role";
    id: string;
  }>;
}) {
  return (
    <section>
      <h2>{props.dashboard.name}</h2>
      <p>Dashboard Editor</p>
      <form action="/api/canvas/dashboards/selected-dashboard" method="post">
        <input
          type="hidden"
          name="dashboardId"
          value={props.dashboard.id}
          readOnly
        />
        <p>
          {props.selectedDashboardId === props.dashboard.id
            ? "Selected for Embed"
            : "Not selected for Embed"}
        </p>
      </form>
      <DashboardSharePanel
        dashboardId={props.dashboard.id}
        shareSubjects={props.shareSubjects}
      />
      <DashboardExportButton />
      <DashboardImportDialog />
    </section>
  );
}
