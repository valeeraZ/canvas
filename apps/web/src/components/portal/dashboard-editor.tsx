"use client";

import React, { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { LayoutTemplate, LoaderCircle, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardCanvas } from "./dashboard-canvas";
import type { DashboardChartState } from "./dashboard-chart-renderer";
import { DashboardExportButton } from "./dashboard-export-button";
import { DashboardImportDialog } from "./dashboard-import-dialog";
import { DashboardSharePanel } from "./dashboard-share-panel";
import { DashboardWidgetConfigPanel } from "./dashboard-widget-config-panel";
import { DashboardWidgetList } from "./dashboard-widget-list";
import { PortalActionAlert } from "./portal-action-alert";
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

type DashboardWidgetSummary = {
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
};

type WidgetConfig = DashboardWidgetSummary["config"];
type WidgetDraftMap = Record<string, NonNullable<WidgetConfig>>;

type DatasetSummary = {
  id: string;
  name: string;
  status: string;
};

type DatasetPreviewSummary = {
  datasetId: string;
  columns: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "date" | "unknown";
  }>;
  sampleRows: Array<Record<string, string | number | boolean | null>>;
  records: Array<Record<string, string | number | boolean | null>>;
};

export type DashboardWidgetChartEntry = {
  queryKey: string | null;
  state: DashboardChartState;
};

const portalApiClient = createPortalApiClient();

function normalizeChartType(
  chartType: NonNullable<NonNullable<WidgetConfig>["chartType"]>
) {
  return chartType === "line" || chartType === "area" ? chartType : "bar";
}

function areWidgetConfigsEqual(
  left: WidgetConfig,
  right: WidgetConfig
) {
  if (left === right) {
    return true;
  }

  if (!left || !right) {
    return left === right;
  }

  return (
    left.datasetId === right.datasetId &&
    left.chartType === right.chartType &&
    left.xField === right.xField &&
    left.yField === right.yField &&
    left.seriesField === right.seriesField &&
    (left.title ?? "") === (right.title ?? "")
  );
}

function buildChartQueryKey(widget: DashboardWidgetSummary): string | null {
  const config = widget.config;

  if (!config?.datasetId || !config.xField || !config.yField) {
    return null;
  }

  if (config.chartType === "pie") {
    return null;
  }

  return [
    config.datasetId,
    normalizeChartType(config.chartType),
    config.xField,
    config.yField
  ].join("|");
}

export function applyWidgetConfigDrafts(
  widgets: DashboardWidgetSummary[],
  drafts: WidgetDraftMap
): DashboardWidgetSummary[] {
  return widgets.map((widget) => {
    const draft = drafts[widget.id];

    if (!draft || areWidgetConfigsEqual(draft, widget.config)) {
      return widget;
    }

    return {
      ...widget,
      datasetId: draft.datasetId,
      config: draft
    };
  });
}

function deriveChartState(input: {
  widget: DashboardWidgetSummary | null;
  datasets: DatasetSummary[];
  datasetPreviews: Record<string, DatasetPreviewSummary | null>;
}): DashboardChartState {
  const config = input.widget?.config;

  if (!config?.datasetId || !config.xField || !config.yField) {
    return {
      status: "idle"
    };
  }

  const dataset = input.datasets.find((item) => item.id === config.datasetId);

  if (!dataset || dataset.status !== "ready") {
    return {
      status: "dataset-importing"
    };
  }

  const preview = input.datasetPreviews[config.datasetId];
  const allowedFields = new Set(preview?.columns.map((column) => column.name) ?? []);

  if (!allowedFields.has(config.xField) || !allowedFields.has(config.yField)) {
    return {
      status: "field-invalid"
    };
  }

  if (config.chartType === "pie") {
    return {
      status: "field-invalid"
    };
  }

  return {
    status: "loading"
  };
}

export function reuseChartState(
  current: DashboardChartState,
  next: DashboardChartState
) {
  if (current.status !== next.status) {
    return next;
  }

  if (current.status === "ready" && next.status === "ready") {
    const sameChartType = current.payload.chartType === next.payload.chartType;
    const sameLabels =
      current.payload.labels.length === next.payload.labels.length &&
      current.payload.labels.every((label, index) => label === next.payload.labels[index]);
    const sameSeries =
      current.payload.series.length === next.payload.series.length &&
      current.payload.series.every((series, index) => {
        const nextSeries = next.payload.series[index];

        return (
          nextSeries &&
          series.name === nextSeries.name &&
          series.data.length === nextSeries.data.length &&
          series.data.every((value, valueIndex) => value === nextSeries.data[valueIndex])
        );
      });

    return sameChartType && sameLabels && sameSeries ? current : next;
  }

  if (current.status === "error" && next.status === "error") {
    return current.message === next.message ? current : next;
  }

  return current;
}

export function buildWidgetChartStateEntries(input: {
  widgets: DashboardWidgetSummary[];
  datasets: DatasetSummary[];
  datasetPreviews: Record<string, DatasetPreviewSummary | null>;
  currentEntries: Record<string, DashboardWidgetChartEntry>;
}): Record<string, DashboardWidgetChartEntry> {
  return Object.fromEntries(
    input.widgets.map((widget) => {
      const nextState = deriveChartState({
        widget,
        datasets: input.datasets,
        datasetPreviews: input.datasetPreviews
      });
      const nextQueryKey = buildChartQueryKey(widget);
      const currentEntry = input.currentEntries[widget.id];

      if (nextState.status === "loading" && nextQueryKey) {
        if (currentEntry?.queryKey === nextQueryKey) {
          return [widget.id, currentEntry] as const;
        }

        return [
          widget.id,
          {
            queryKey: nextQueryKey,
            state: { status: "loading" as const }
          }
        ] as const;
      }

      const reusedState = currentEntry
        ? reuseChartState(currentEntry.state, nextState)
        : nextState;

      if (currentEntry?.queryKey === null && reusedState === currentEntry.state) {
        return [widget.id, currentEntry] as const;
      }

      return [
        widget.id,
        {
          queryKey: null,
          state: reusedState
        }
      ] as const;
    })
  );
}

export function DashboardEditor(props: {
  dashboard: {
    id: string;
    name: string;
  };
  previewHref?: string;
  selectedDashboardId: string | null;
  widgets: DashboardWidgetSummary[];
  datasets: DatasetSummary[];
  datasetPreviews: Record<string, DatasetPreviewSummary | null>;
  shareSubjects: Array<{
    type: "user" | "group" | "role";
    id: string;
  }>;
}) {
  const router = useRouter();
  const isSelected = props.selectedDashboardId === props.dashboard.id;
  const [editorPending, setEditorPending] = useState(false);
  const [error, setError] = useState<PortalApiError | null>(null);
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(
    props.widgets[0]?.id ?? null
  );
  const [widgetDrafts, setWidgetDrafts] = useState<WidgetDraftMap>({});
  const [savingWidgetIds, setSavingWidgetIds] = useState<Record<string, boolean>>({});
  const [chartEntries, setChartEntries] = useState<
    Record<string, DashboardWidgetChartEntry>
  >(() =>
    buildWidgetChartStateEntries({
      widgets: props.widgets,
      datasets: props.datasets,
      datasetPreviews: props.datasetPreviews,
      currentEntries: {}
    })
  );

  const effectiveWidgets = applyWidgetConfigDrafts(props.widgets, widgetDrafts);
  const activeWidget =
    effectiveWidgets.find((widget) => widget.id === activeWidgetId) ?? null;
  const activeWidgetPending = activeWidgetId ? Boolean(savingWidgetIds[activeWidgetId]) : false;
  const chartStates = Object.fromEntries(
    Object.entries(chartEntries).map(([widgetId, entry]) => [widgetId, entry.state])
  ) as Record<string, DashboardChartState>;
  const canAddChart = props.datasets.some((dataset) => {
    const preview = props.datasetPreviews[dataset.id];
    return Boolean(preview && preview.columns.length > 0);
  });

  useEffect(() => {
    if (!effectiveWidgets.some((widget) => widget.id === activeWidgetId)) {
      setActiveWidgetId(effectiveWidgets[0]?.id ?? null);
    }
  }, [activeWidgetId, effectiveWidgets]);

  useEffect(() => {
    setWidgetDrafts((current) => {
      const next: WidgetDraftMap = {};
      let changed = false;

      for (const widget of props.widgets) {
        const draft = current[widget.id];

        if (draft && !areWidgetConfigsEqual(draft, widget.config)) {
          next[widget.id] = draft;
        } else if (draft) {
          changed = true;
        }
      }

      for (const widgetId of Object.keys(current)) {
        if (!props.widgets.some((widget) => widget.id === widgetId)) {
          changed = true;
        }
      }

      if (!changed && Object.keys(next).length === Object.keys(current).length) {
        return current;
      }

      return next;
    });
  }, [props.widgets]);

  useEffect(() => {
    setChartEntries((current) =>
      buildWidgetChartStateEntries({
        widgets: effectiveWidgets,
        datasets: props.datasets,
        datasetPreviews: props.datasetPreviews,
        currentEntries: current
      })
    );
  }, [props.widgets, widgetDrafts, props.datasets, props.datasetPreviews]);

  useEffect(() => {
    const loadingEntries = Object.entries(chartEntries).filter(([, entry]) => {
      return entry.state.status === "loading" && entry.queryKey;
    });

    if (loadingEntries.length === 0) {
      return;
    }

    let cancelled = false;

    for (const [widgetId, entry] of loadingEntries) {
      const widget = effectiveWidgets.find((item) => item.id === widgetId);

      if (!widget?.config) {
        continue;
      }

      void portalApiClient
        .runDatasetChartQuery({
          datasetId: widget.config.datasetId,
          chartType: normalizeChartType(widget.config.chartType),
          xField: widget.config.xField,
          yField: widget.config.yField
        })
        .then((payload) => {
          if (cancelled) {
            return;
          }

          const hasValues =
            payload.labels.length > 0 &&
            payload.series.some((series) => series.data.length > 0);

          setChartEntries((current) => {
            const currentEntry = current[widgetId];

            if (!currentEntry || currentEntry.queryKey !== entry.queryKey) {
              return current;
            }

            const nextState: DashboardChartState = hasValues
              ? {
                  status: "ready",
                  payload
                }
              : {
                  status: "empty"
                };
            const reusedState = reuseChartState(currentEntry.state, nextState);

            if (reusedState === currentEntry.state) {
              return current;
            }

            return {
              ...current,
              [widgetId]: {
                queryKey: entry.queryKey,
                state: reusedState
              }
            };
          });
        })
        .catch((caught) => {
          if (cancelled) {
            return;
          }

          const portalError = toPortalApiError(caught);

          setChartEntries((current) => {
            const currentEntry = current[widgetId];

            if (!currentEntry || currentEntry.queryKey !== entry.queryKey) {
              return current;
            }

            const nextState: DashboardChartState = {
              status: "error",
              message: portalError.requestId
                ? `${portalError.message} (Request ID: ${portalError.requestId})`
                : portalError.message
            };
            const reusedState = reuseChartState(currentEntry.state, nextState);

            if (reusedState === currentEntry.state) {
              return current;
            }

            return {
              ...current,
              [widgetId]: {
                queryKey: entry.queryKey,
                state: reusedState
              }
            };
          });
        });
    }

    return () => {
      cancelled = true;
    };
  }, [chartEntries, props.widgets, widgetDrafts]);

  function setSelectedDashboard() {
    setEditorPending(true);
    setError(null);

    startTransition(async () => {
      try {
        await portalApiClient.setSelectedDashboard({
          dashboardId: props.dashboard.id
        });
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setEditorPending(false);
      }
    });
  }

  function addChartWidget() {
    if (!canAddChart) {
      return;
    }

    setEditorPending(true);
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
        await portalApiClient.createDashboardWidget({
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
        setEditorPending(false);
      }
    });
  }

  function saveWidget(
    widgetId: string,
    config: {
      datasetId: string;
      chartType: "bar" | "line" | "area" | "pie";
      xField: string;
      yField: string;
      seriesField?: string;
      title?: string;
    }
  ) {
    setWidgetDrafts((current) => ({
      ...current,
      [widgetId]: config
    }));
    setSavingWidgetIds((current) => ({
      ...current,
      [widgetId]: true
    }));
    setError(null);

    startTransition(async () => {
      try {
        await portalApiClient.updateDashboardWidget({
          dashboardId: props.dashboard.id,
          widgetId,
          config
        });
        router.refresh();
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setSavingWidgetIds((current) => {
          if (!current[widgetId]) {
            return current;
          }

          const next = { ...current };
          delete next[widgetId];
          return next;
        });
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
            disabled={editorPending || isSelected}
          >
            {editorPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LayoutTemplate className="h-4 w-4" />
            )}
            {isSelected ? "Selected" : "Select for embed"}
          </Button>
        </div>
        <div className="flex gap-2">
          {props.previewHref ? (
            <Button asChild variant="outline">
              <Link href={props.previewHref}>Back to preview</Link>
            </Button>
          ) : null}
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
              widgets={effectiveWidgets}
              activeWidgetId={activeWidgetId}
              editorPending={editorPending}
              canAddChart={canAddChart}
              savingWidgetIds={savingWidgetIds}
              chartStates={chartStates}
              addChartHint={
                canAddChart
                  ? undefined
                  : "Upload a dataset to start adding chart widgets."
              }
              onSelectWidget={setActiveWidgetId}
              onAddChart={addChartWidget}
            />
            <div className="grid gap-4">
              <PortalActionAlert
                error={error}
                title="Dashboard editor action failed"
              />
              <DashboardCanvas
                widgets={effectiveWidgets}
                activeWidgetId={activeWidgetId}
                savingWidgetIds={savingWidgetIds}
                chartStates={chartStates}
                onSelectWidget={setActiveWidgetId}
              />
            </div>
            <DashboardWidgetConfigPanel
              widget={activeWidget}
              datasets={props.datasets}
              previews={props.datasetPreviews}
              pending={activeWidgetPending}
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
