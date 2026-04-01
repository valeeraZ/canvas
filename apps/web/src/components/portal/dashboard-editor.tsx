"use client";

import React, { startTransition, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  PanelTopOpen,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardExportButton } from "./dashboard-export-button";
import { DashboardImportDialog } from "./dashboard-import-dialog";
import { PortalActionAlert } from "./portal-action-alert";
import { DashboardSharePanel } from "./dashboard-share-panel";
import {
  createPortalApiClient,
  type PortalApiError,
  toPortalApiError
} from "../../lib/portal/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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
  const [error, setError] = useState<PortalApiError | null>(null);

  function setSelectedDashboard() {
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.setSelectedDashboard({
          dashboardId: props.dashboard.id
        });
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-2">
          <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground" href="/portal/dashboards">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboards
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-semibold">{props.dashboard.name}</h2>
            <Badge variant={isSelected ? "secondary" : "outline"}>
              {isSelected ? "Selected for embed" : "Available for embed"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Dashboard ID: {props.dashboard.id}
          </p>
        </div>
        <div className="flex gap-2">
          <DashboardExportButton dashboardId={props.dashboard.id} />
          <DashboardImportDialog />
        </div>
      </div>
      <Tabs defaultValue="overview" className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="io">Import / Export</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PanelTopOpen className="h-4 w-4 text-muted-foreground" />
                  Embed default
                </CardTitle>
                <CardDescription>
                  Pick whether this dashboard should be the current default for the active app.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <PortalActionAlert error={error} title="Embed selection failed" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  {isSelected ? "Selected for embed" : "Not selected for embed"}
                </div>
                <Button type="button" onClick={setSelectedDashboard} disabled={pending}>
                  {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {isSelected ? "Keep selected" : "Make selected dashboard"}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribution snapshot</CardTitle>
                <CardDescription>
                  Quick view of the current sharing footprint for this dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <p className="font-medium">Visibility subjects</p>
                  <p className="mt-1 text-muted-foreground">
                    {props.shareSubjects.length} configured subjects across users,
                    groups, and roles.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {props.shareSubjects.map((subject) => (
                    <Badge key={`${subject.type}:${subject.id}`} variant="outline">
                      {subject.type}:{subject.id}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="sharing">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                  Visibility subjects
                </CardTitle>
                <CardDescription>
                  Share this dashboard with external users, groups, or roles.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DashboardSharePanel
                  dashboardId={props.dashboard.id}
                  shareSubjects={props.shareSubjects}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="io">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export dashboard</CardTitle>
                <CardDescription>
                  Package this dashboard for reuse across apps or environments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardExportButton dashboardId={props.dashboard.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Import dashboard</CardTitle>
                <CardDescription>
                  Bring an existing dashboard definition into the active app.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardImportDialog />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
