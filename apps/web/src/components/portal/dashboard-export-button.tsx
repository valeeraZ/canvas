import React, { startTransition, useState } from "react";
import { Download } from "lucide-react";
import { createPortalApiClient } from "../../lib/portal/api-client";
import { Button } from "../ui/button";

export function DashboardExportButton(props: {
  dashboardId: string;
}) {
  const apiClient = createPortalApiClient();
  const [pending, setPending] = useState(false);

  function exportDashboard() {
    setPending(true);

    startTransition(async () => {
      try {
        const payload = await apiClient.exportDashboard({
          dashboardId: props.dashboardId
        });
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${props.dashboardId}.canvas-dashboard.json`;
        link.click();
        URL.revokeObjectURL(url);
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <Button type="button" variant="outline" onClick={exportDashboard} disabled={pending}>
      <Download className="h-4 w-4" />
      {pending ? "Exporting..." : "Export dashboard"}
    </Button>
  );
}
