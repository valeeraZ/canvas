"use client";

import React, { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
import {
  createPortalApiClient,
  type PortalApiError,
  toPortalApiError
} from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function CreateDashboardDialog(props: {
  appName: string;
}) {
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<PortalApiError | null>(null);
  const [pending, setPending] = useState(false);

  function submit() {
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const dashboard = await apiClient.createDashboard({
          name: name.trim() || "Untitled Dashboard",
          workbookId: null
        });
        setOpen(false);
        setName("");
        router.push(`/portal/${props.appName}/${dashboard.id}`);
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create dashboard
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create dashboard</DialogTitle>
          <DialogDescription>
            Create a new dashboard in the current app.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="create-dashboard-name">Dashboard name</Label>
            <Input
              id="create-dashboard-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Executive Overview"
            />
          </div>
        </div>
        <PortalActionAlert error={error} title="Dashboard creation failed" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Save dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
