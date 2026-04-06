"use client";

import React, { startTransition, useState } from "react";
import {
  CheckCircle2,
  LayoutTemplate,
  LoaderCircle,
  PencilLine,
  Share2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardExportButton } from "./dashboard-export-button";
import { DashboardImportDialog } from "./dashboard-import-dialog";
import { DashboardChartRenderer } from "./dashboard-chart-renderer";
import { PortalActionAlert } from "./portal-action-alert";
import { DashboardSharePanel } from "./dashboard-share-panel";
import { DashboardWidgetConfigPanel } from "./dashboard-widget-config-panel";
import { DashboardWidgetList } from "./dashboard-widget-list";
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
  widgets: Array<{
    id: string;
    tenantId: string;
    dashboardId: string;
    type: "chart" | "table" | "metric" | "text";
    datasetId: string | null;
    config: {
      datasetId: string;
      chartType: "bar" | "line" | "area" | "pie";
      xField: string;
      yField: string;
      seriesField?: string;
      title?: string;
    } | null;
  }>;
  datasets: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  datasetPreviews: Record<
    string,
    | {
        datasetId: string;
        columns: Array<{
          name: string;
          type: "string" | "number" | "boolean" | "date" | "unknown";
        }>;
        sampleRows: Array<Record<string, string | number | boolean | null>>;
        records: Array<Record<string, string | number | boolean | null>>;
      }
    | null
  >;
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
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(
    props.widgets[0]?.id ?? null
  );

  const activeWidget =
    props.widgets.find((widget) => widget.id === activeWidgetId) ?? null;
  const canAddChart = props.datasets.some((dataset) => {
    const preview = props.datasetPreviews[dataset.id];
    return Boolean(preview && preview.columns.length > 0);
  });

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

  function addChartWidget() {
    if (!canAddChart) {
      return;
    }

    setPending(true);
    setError(null);

    const firstDataset =
      props.datasets.find((dataset) => {
        const preview = props.datasetPreviews[dataset.id];
        return Boolean(preview && preview.columns.length > 0);
      }) ?? null;
    const preview = firstDataset ? props.datasetPreviews[firstDataset.id] : null;
    const columns = preview?.columns ?? [];

    startTransition(async () => {
      try {
        await apiClient.createDashboardWidget({
          dashboardId: props.dashboard.id,
          type: "chart",
          datasetId: firstDataset?.id ?? null,
          config: firstDataset
            ? {
                datasetId: firstDataset.id,
                chartType: "bar",
                xField: columns[0]?.name ?? "",
                yField:
                  columns.find((column) => column.type === "number")?.name ??
                  columns[1]?.name ??
                  ""
              }
            : null
        });
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setPending(false);
      }
    });
  }

  function saveWidget(widgetId: string, config: {
    datasetId: string;
    chartType: "bar" | "line" | "area" | "pie";
    xField: string;
    yField: string;
    seriesField?: string;
    title?: string;
  }) {
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.updateDashboardWidget({
          dashboardId: props.dashboard.id,
          widgetId,
          config
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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isSelected ? "secondary" : "outline"}>
            {isSelected ? "Selected for embed" : "Available for embed"}
          </Badge>
          <Button
            type="button"
            variant={isSelected ? "secondary" : "outline"}
            size="sm"
            onClick={setSelectedDashboard}
            disabled={pending || isSelected}
          >
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <LayoutTemplate className="h-4 w-4" />}
            {isSelected ? "Selected" : "Select for embed"}
          </Button>
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
          <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
            <DashboardWidgetList
              widgets={props.widgets}
              activeWidgetId={activeWidgetId}
              pending={pending}
              canAddChart={canAddChart}
              addChartHint={
                canAddChart
                  ? undefined
                  : "Upload a dataset to start adding chart widgets."
              }
              onSelectWidget={setActiveWidgetId}
              onAddChart={addChartWidget}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dashboard canvas</CardTitle>
                <CardDescription>
                  Dashboard ID: {props.dashboard.id}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <PortalActionAlert error={error} title="Dashboard editor action failed" />
                {props.widgets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8">
                    <div className="grid gap-2">
                      <p className="text-base font-medium">View dashboard</p>
                      <p className="text-sm text-muted-foreground">
                        Add a chart widget to start rendering dashboard content.
                      </p>
                    </div>
                    <div className="mt-6 grid gap-2">
                      <p className="text-base font-medium">Edit tools</p>
                      <p className="text-sm text-muted-foreground">
                        Dataset binding, widget configuration, and chart controls will appear here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 2xl:grid-cols-2">
                    {props.widgets.map((widget) => (
                      <DashboardChartRenderer
                        key={widget.id}
                        widget={widget}
                        preview={
                          widget.config?.datasetId
                            ? props.datasetPreviews[widget.config.datasetId] ?? null
                            : null
                        }
                        active={widget.id === activeWidgetId}
                        onSelect={() => setActiveWidgetId(widget.id)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <DashboardWidgetConfigPanel
              widget={activeWidget}
              datasets={props.datasets}
              previews={props.datasetPreviews}
              pending={pending}
              onSave={saveWidget}
            />
          </div>
        </TabsContent>
        <TabsContent value="sharing">
          <div className="grid gap-4">
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
