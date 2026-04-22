"use client";

import React, { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LayoutTemplate, LoaderCircle, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardCanvas } from "./dashboard-canvas";
import type { DashboardChartState } from "./dashboard-chart-renderer";
import type { DashboardTableState } from "./dashboard-table-renderer";
import {
  reorderDashboardCanvasWidgets,
  resizeDashboardCanvasWidget
} from "./dashboard-widget-layout";
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

type VisualWidgetConfig = {
  datasetId: string;
  chartType: "bar" | "line" | "area" | "pie" | "radar" | "radial";
  xField: string;
  yField: string;
  seriesField?: string;
  title?: string;
};

type TableWidgetConfig = {
  datasetId: string;
  chartType: "table";
  columns: string[];
  pageSize: number;
  title?: string;
};

type DashboardWidgetSummary = {
  id: string;
  tenantId: string;
  dashboardId: string;
  type: "chart" | "table" | "metric" | "text";
  datasetId: string | null;
  config: VisualWidgetConfig | TableWidgetConfig | null;
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
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
};

export type DashboardWidgetChartEntry = {
  queryKey: string | null;
  state: DashboardChartState;
};

export type DashboardWidgetTableEntry = {
  queryKey: string | null;
  state: DashboardTableState;
};

const portalApiClient = createPortalApiClient();

function normalizeChartType(chartType: "bar" | "line" | "area" | "pie" | "radar" | "radial") {
  return chartType;
}

function isChartConfig(config: WidgetConfig | undefined): config is VisualWidgetConfig {
  return Boolean(config && "chartType" in config && !("columns" in config));
}

function isTableConfig(config: WidgetConfig | undefined): config is TableWidgetConfig {
  return Boolean(config && "columns" in config);
}

function isTableWidget(widget: DashboardWidgetSummary | null | undefined) {
  return Boolean(
    widget &&
      (widget.type === "table" ||
        (widget.config &&
          "chartType" in widget.config &&
          widget.config.chartType === "table"))
  );
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
    isChartConfig(left) &&
    isChartConfig(right) &&
    left.chartType === right.chartType &&
    left.xField === right.xField &&
    left.yField === right.yField &&
    left.seriesField === right.seriesField &&
    (left.title ?? "") === (right.title ?? "")
  );
}

function buildChartQueryKey(widget: DashboardWidgetSummary): string | null {
  const config = widget.config;

  if (widget.type !== "chart" || !isChartConfig(config) || !config.datasetId || !config.xField || !config.yField) {
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
  let changed = false;

  const nextWidgets = widgets.map((widget) => {
    const draft = drafts[widget.id];

    if (!draft || areWidgetConfigsEqual(draft, widget.config)) {
      return widget;
    }

    changed = true;

    return {
      ...widget,
      datasetId: draft.datasetId,
      config: draft
    };
  });

  return changed ? nextWidgets : widgets;
}

export function applyWidgetLayoutSwap(
  widgets: DashboardWidgetSummary[],
  widgetId: string,
  targetWidgetId: string
) {
  return reorderDashboardCanvasWidgets(widgets, widgetId, targetWidgetId);
}

export function applyWidgetLayoutResize(
  widgets: DashboardWidgetSummary[],
  widgetId: string,
  nextWidth: number
) {
  return resizeDashboardCanvasWidget(widgets, widgetId, nextWidth);
}

export function resolveDeletedWidgetFocus(
  widgets: DashboardWidgetSummary[],
  deletedWidgetId: string
) {
  const deleteIndex = widgets.findIndex((widget) => widget.id === deletedWidgetId);

  if (deleteIndex === -1) {
    return widgets[0]?.id ?? null;
  }

  const remainingWidgets = widgets.filter((widget) => widget.id !== deletedWidgetId);

  if (remainingWidgets.length === 0) {
    return null;
  }

  return remainingWidgets[Math.min(deleteIndex, remainingWidgets.length - 1)]?.id ?? null;
}

function collectChangedWidgetIds(
  previousWidgets: DashboardWidgetSummary[],
  nextWidgets: DashboardWidgetSummary[]
) {
  const previousLayouts = new Map(
    previousWidgets.map((widget) => [
      widget.id,
      `${widget.layout?.x ?? 0}:${widget.layout?.y ?? 0}:${widget.layout?.w ?? 1}:${widget.layout?.h ?? 1}`
    ])
  );

  return nextWidgets
    .filter((widget) => {
      return (
        previousLayouts.get(widget.id) !==
        `${widget.layout?.x ?? 0}:${widget.layout?.y ?? 0}:${widget.layout?.w ?? 1}:${widget.layout?.h ?? 1}`
      );
    })
    .map((widget) => widget.id);
}

function deriveChartState(input: {
  widget: DashboardWidgetSummary | null;
  datasets: DatasetSummary[];
  datasetPreviews: Record<string, DatasetPreviewSummary | null>;
}): DashboardChartState {
  const config = input.widget?.config;

  if (
    input.widget?.type !== "chart" ||
    !isChartConfig(config) ||
    !config.datasetId ||
    !config.xField ||
    !config.yField
  ) {
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

  return {
    status: "loading"
  };
}

function buildTableQueryKey(widget: DashboardWidgetSummary, page = 1): string | null {
  const config = widget.config;

  if (!isTableWidget(widget) || !isTableConfig(config) || !config.datasetId) {
    return null;
  }

  return [
    config.datasetId,
    config.columns.join(","),
    config.pageSize,
    page
  ].join("|");
}

function deriveTableState(input: {
  widget: DashboardWidgetSummary | null;
  datasets: DatasetSummary[];
  datasetPreviews: Record<string, DatasetPreviewSummary | null>;
}): DashboardTableState {
  const config = input.widget?.config;

  if (!isTableWidget(input.widget) || !isTableConfig(config) || !config.datasetId) {
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

  if (config.columns.some((column) => !allowedFields.has(column))) {
    return {
      status: "field-invalid"
    };
  }

  return {
    status: "loading"
  };
}

export function buildWidgetTableStateEntries(input: {
  widgets: DashboardWidgetSummary[];
  datasets: DatasetSummary[];
  datasetPreviews: Record<string, DatasetPreviewSummary | null>;
  currentEntries: Record<string, DashboardWidgetTableEntry>;
}): Record<string, DashboardWidgetTableEntry> {
  return Object.fromEntries(
    input.widgets
      .filter((widget) => isTableWidget(widget))
      .map((widget) => {
        const currentEntry = input.currentEntries[widget.id];
        const currentPage =
          currentEntry?.state.status === "ready" ? currentEntry.state.payload.page : 1;
        const nextState = deriveTableState({
          widget,
          datasets: input.datasets,
          datasetPreviews: input.datasetPreviews
        });
        const nextQueryKey = buildTableQueryKey(widget, currentPage);

        if (nextState.status === "loading" && nextQueryKey) {
          if (currentEntry?.queryKey === nextQueryKey) {
            return [widget.id, currentEntry] as const;
          }

          return [
            widget.id,
            {
              queryKey: nextQueryKey,
              state: nextState
            }
          ] as const;
        }

        return [
          widget.id,
          {
            queryKey: null,
            state: nextState
          }
        ] as const;
      })
  );
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
  let changed = false;
  const nextEntries = Object.fromEntries(
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

        changed = true;

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

      changed = true;

      return [
        widget.id,
        {
          queryKey: null,
          state: reusedState
        }
      ] as const;
    })
  );

  if (!changed && Object.keys(nextEntries).length === Object.keys(input.currentEntries).length) {
    return input.currentEntries;
  }

  return nextEntries;
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
  const [optimisticWidgets, setOptimisticWidgets] = useState(props.widgets);
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
  const [tableEntries, setTableEntries] = useState<
    Record<string, DashboardWidgetTableEntry>
  >(() =>
    buildWidgetTableStateEntries({
      widgets: props.widgets,
      datasets: props.datasets,
      datasetPreviews: props.datasetPreviews,
      currentEntries: {}
    })
  );

  const effectiveWidgets = useMemo(
    () => applyWidgetConfigDrafts(optimisticWidgets, widgetDrafts),
    [optimisticWidgets, widgetDrafts]
  );
  const activeWidget =
    effectiveWidgets.find((widget) => widget.id === activeWidgetId) ?? null;
  const activeWidgetPending = activeWidgetId ? Boolean(savingWidgetIds[activeWidgetId]) : false;
  const chartStates = Object.fromEntries(
    Object.entries(chartEntries).map(([widgetId, entry]) => [widgetId, entry.state])
  ) as Record<string, DashboardChartState>;
  const tableStates = Object.fromEntries(
    Object.entries(tableEntries).map(([widgetId, entry]) => [widgetId, entry.state])
  ) as Record<string, DashboardTableState>;
  const canAddChart = props.datasets.some((dataset) => {
    const preview = props.datasetPreviews[dataset.id];
    return Boolean(preview && preview.columns.length > 0);
  });

  useEffect(() => {
    setOptimisticWidgets(props.widgets);
  }, [props.widgets]);

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
  }, [effectiveWidgets, props.datasets, props.datasetPreviews]);

  useEffect(() => {
    setTableEntries((current) =>
      buildWidgetTableStateEntries({
        widgets: effectiveWidgets,
        datasets: props.datasets,
        datasetPreviews: props.datasetPreviews,
        currentEntries: current
      })
    );
  }, [effectiveWidgets, props.datasets, props.datasetPreviews]);

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

      if (!widget?.config || !isChartConfig(widget.config)) {
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
  }, [chartEntries, effectiveWidgets]);

  useEffect(() => {
    const loadingEntries = Object.entries(tableEntries).filter(([, entry]) => {
      return entry.state.status === "loading" && entry.queryKey;
    });

    if (loadingEntries.length === 0) {
      return;
    }

    let cancelled = false;

    for (const [widgetId, entry] of loadingEntries) {
      const widget = effectiveWidgets.find((item) => item.id === widgetId);

      if (!widget?.config || !isTableConfig(widget.config)) {
        continue;
      }

      const page = Number(entry.queryKey?.split("|").at(-1) ?? 1);

      void portalApiClient
        .getDatasetRowsPage({
          datasetId: widget.config.datasetId,
          page,
          pageSize: widget.config.pageSize,
          columns: widget.config.columns
        })
        .then((payload) => {
          if (cancelled) {
            return;
          }

          setTableEntries((current) => {
            const currentEntry = current[widgetId];

            if (!currentEntry || currentEntry.queryKey !== entry.queryKey) {
              return current;
            }

            return {
              ...current,
              [widgetId]: {
                queryKey: entry.queryKey,
                state: payload.rows.length > 0
                  ? { status: "ready", payload }
                  : { status: "empty" }
              }
            };
          });
        })
        .catch((caught) => {
          if (cancelled) {
            return;
          }

          const portalError = toPortalApiError(caught);

          setTableEntries((current) => {
            const currentEntry = current[widgetId];

            if (!currentEntry || currentEntry.queryKey !== entry.queryKey) {
              return current;
            }

            return {
              ...current,
              [widgetId]: {
                queryKey: entry.queryKey,
                state: {
                  status: "error",
                  message: portalError.requestId
                    ? `${portalError.message} (Request ID: ${portalError.requestId})`
                    : portalError.message
                }
              }
            };
          });
        });
    }

    return () => {
      cancelled = true;
    };
  }, [tableEntries, effectiveWidgets]);

  function changeTablePage(widgetId: string, page: number) {
    const widget = effectiveWidgets.find((item) => item.id === widgetId);
    const queryKey = widget ? buildTableQueryKey(widget, page) : null;

    if (!queryKey) {
      return;
    }

    setTableEntries((current) => ({
      ...current,
      [widgetId]: {
        queryKey,
        state: { status: "loading" }
      }
    }));
  }

  function setWidgetsSaving(widgetIds: string[], pending: boolean) {
    setSavingWidgetIds((current) => {
      const next = { ...current };

      for (const widgetId of widgetIds) {
        if (pending) {
          next[widgetId] = true;
        } else {
          delete next[widgetId];
        }
      }

      return next;
    });
  }

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

  function addTableWidget() {
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
    const columns = preview?.columns.map((column) => column.name) ?? [];

    startTransition(async () => {
      try {
        await portalApiClient.createDashboardWidget({
          dashboardId: props.dashboard.id,
          type: "chart",
          datasetId: firstDataset?.id ?? null,
          config: firstDataset
            ? {
                datasetId: firstDataset.id,
                chartType: "table",
                columns,
                pageSize: 10,
                title: ""
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
    config: NonNullable<WidgetConfig>
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

  function moveWidget(widgetId: string, targetWidgetId: string) {
    const previousWidgets = optimisticWidgets;
    const nextWidgets = applyWidgetLayoutSwap(previousWidgets, widgetId, targetWidgetId);
    const movedWidget = nextWidgets.find((widget) => widget.id === widgetId);
    const changedWidgetIds = collectChangedWidgetIds(previousWidgets, nextWidgets);

    if (!movedWidget?.layout || nextWidgets === previousWidgets || changedWidgetIds.length === 0) {
      return;
    }

    const layout = movedWidget.layout;

    setOptimisticWidgets(nextWidgets);
    setActiveWidgetId(widgetId);
    setWidgetsSaving(changedWidgetIds, true);
    setError(null);

    startTransition(async () => {
      try {
        await portalApiClient.updateDashboardWidgetLayout({
          dashboardId: props.dashboard.id,
          widgetId,
          layout
        });
        router.refresh();
      } catch (caught) {
        setOptimisticWidgets(previousWidgets);
        setError(toPortalApiError(caught));
      } finally {
        setWidgetsSaving(changedWidgetIds, false);
      }
    });
  }

  function resizeWidget(widgetId: string, nextWidth: number) {
    const previousWidgets = optimisticWidgets;
    const nextWidgets = applyWidgetLayoutResize(previousWidgets, widgetId, nextWidth);
    const resizedWidget = nextWidgets.find((widget) => widget.id === widgetId);
    const changedWidgetIds = collectChangedWidgetIds(previousWidgets, nextWidgets);

    if (
      !resizedWidget?.layout ||
      nextWidgets === previousWidgets ||
      changedWidgetIds.length === 0
    ) {
      return;
    }

    const layout = resizedWidget.layout;

    setOptimisticWidgets(nextWidgets);
    setActiveWidgetId(widgetId);
    setWidgetsSaving(changedWidgetIds, true);
    setError(null);

    startTransition(async () => {
      try {
        await portalApiClient.updateDashboardWidgetLayout({
          dashboardId: props.dashboard.id,
          widgetId,
          layout
        });
        router.refresh();
      } catch (caught) {
        setOptimisticWidgets(previousWidgets);
        setError(toPortalApiError(caught));
      } finally {
        setWidgetsSaving(changedWidgetIds, false);
      }
    });
  }

  function deleteWidget(widgetId: string) {
    const previousWidgets = optimisticWidgets;
    const nextWidgets = optimisticWidgets.filter((widget) => widget.id !== widgetId);

    setOptimisticWidgets(nextWidgets);
    setActiveWidgetId(resolveDeletedWidgetFocus(optimisticWidgets, widgetId));
    setWidgetsSaving([widgetId], true);
    setError(null);

    startTransition(async () => {
      try {
        const result = await portalApiClient.deleteDashboardWidget({
          dashboardId: props.dashboard.id,
          widgetId
        });
        setOptimisticWidgets(result.widgets);
        setActiveWidgetId(resolveDeletedWidgetFocus(previousWidgets, widgetId));
        router.refresh();
      } catch (caught) {
        setOptimisticWidgets(previousWidgets);
        setActiveWidgetId(previousWidgets.find((widget) => widget.id === activeWidgetId)?.id ?? previousWidgets[0]?.id ?? null);
        setError(toPortalApiError(caught));
      } finally {
        setWidgetsSaving([widgetId], false);
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
              onAddTable={addTableWidget}
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
                tableStates={tableStates}
                onSelectWidget={setActiveWidgetId}
                onMoveWidget={moveWidget}
                onResizeWidget={resizeWidget}
                onDeleteWidget={deleteWidget}
                onTablePageChange={changeTablePage}
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
