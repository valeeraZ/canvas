"use client";

import React, { startTransition, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, LoaderCircle, PanelTopOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardExportButton } from "./dashboard-export-button";
import { DashboardImportDialog } from "./dashboard-import-dialog";
import { DashboardSharePanel } from "./dashboard-share-panel";
import { createPortalApiClient } from "../../lib/portal/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";

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
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const isSelected = props.selectedDashboardId === props.dashboard.id;
  const [pending, setPending] = useState(false);

  function setSelectedDashboard() {
    setPending(true);

    startTransition(async () => {
      try {
        await apiClient.setSelectedDashboard({
          dashboardId: props.dashboard.id
        });
        router.refresh();
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <Link
            className="inline-flex items-center gap-2 text-sm text-canvas-muted"
            href="/portal/dashboards"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboards
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold">{props.dashboard.name}</h2>
            <Badge variant={isSelected ? "accent" : "default"}>
              {isSelected ? "Selected for embed" : "Available for embed"}
            </Badge>
          </div>
          <p className="text-sm text-canvas-muted">
            Dashboard ID: {props.dashboard.id}
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardExportButton />
          <DashboardImportDialog />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PanelTopOpen className="h-4 w-4 text-canvas-accent" />
              Embed default
            </CardTitle>
            <CardDescription>
              Pick whether this dashboard should be the current default for the active
              app.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-2 text-sm text-canvas-muted">
              <CheckCircle2 className="h-4 w-4" />
              {isSelected
                ? "Selected for embed"
                : "Not selected for embed"}
            </div>
            <Button
              type="button"
              onClick={setSelectedDashboard}
              disabled={pending}
            >
              {pending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : null}
              {isSelected ? "Keep selected" : "Make selected dashboard"}
            </Button>
          </CardContent>
        </Card>
        <DashboardSharePanel
          dashboardId={props.dashboard.id}
          shareSubjects={props.shareSubjects}
        />
      </div>
    </section>
  );
}
