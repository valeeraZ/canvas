import React from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/button";

export function DashboardExportButton() {
  return (
    <Button type="button" variant="outline">
      <Download className="h-4 w-4" />
      Export dashboard
    </Button>
  );
}
