"use client";

import React, { startTransition, useState } from "react";
import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortalApiClient } from "../../lib/portal/api-client";
import {
  type PortalApiError,
  toPortalApiError
} from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogFooter,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

export function DashboardImportDialog() {
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const [value, setValue] = useState(
    JSON.stringify(
      {
        version: 1,
        dashboard: {
          name: "Imported Dashboard",
          workbookId: null
        },
        shareSubjects: []
      },
      null,
      2
    )
  );
  const [error, setError] = useState<PortalApiError | null>(null);
  const [pending, setPending] = useState(false);

  function importDashboard() {
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const parsed = JSON.parse(value) as Parameters<
          ReturnType<typeof createPortalApiClient>["importDashboard"]
        >[0];
        await apiClient.importDashboard(parsed);
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Upload className="h-4 w-4" />
          Import dashboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import dashboard</DialogTitle>
          <DialogDescription>
            Paste a lightweight dashboard package JSON payload to create a dashboard in the active app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="dashboard-import-json">Dashboard package</Label>
          <Input
            id="dashboard-import-json"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <PortalActionAlert error={error} title="Import failed" />
        </div>
        <DialogFooter>
          <Button type="button" onClick={importDashboard} disabled={pending}>
            <Upload className="h-4 w-4" />
            {pending ? "Importing..." : "Import dashboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
