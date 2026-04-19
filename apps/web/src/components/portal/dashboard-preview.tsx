"use client";

import React, { useEffect, useState } from "react";
import { createPortalApiClient, toPortalApiError } from "../../lib/portal/api-client";
import { DashboardCanvas } from "./dashboard-canvas";
import type { DashboardChartState } from "./dashboard-chart-renderer";
import {
  buildWidgetChartStateEntries,
  reuseChartState,
  type DashboardWidgetChartEntry
} from "./dashboard-editor";

type WidgetSummary = {
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
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  } | null;
};

type DatasetDetailSummary = {
  id: string;
  name: string;
  sourceFilename?: string;
} | null;

type DatasetPreviewSummary = {
  datasetId: string;
  columns: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "date" | "unknown";
  }>;
  sampleRows: Array<Record<string, string | number | boolean | null>>;
  records: Array<Record<string, string | number | boolean | null>>;
};

const portalApiClient = createPortalApiClient();

export function DashboardPreview(props: {
  widgets: WidgetSummary[];
  datasets?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  datasetPreviews?: Record<string, DatasetPreviewSummary | null>;
  datasetDetails: Record<string, DatasetDetailSummary>;
}) {
  const [chartEntries, setChartEntries] = useState<Record<string, DashboardWidgetChartEntry>>(
    () =>
      buildWidgetChartStateEntries({
        widgets: props.widgets,
        datasets: props.datasets ?? [],
        datasetPreviews: props.datasetPreviews ?? {},
        currentEntries: {}
      })
  );

  useEffect(() => {
    setChartEntries((current) =>
      buildWidgetChartStateEntries({
        widgets: props.widgets,
        datasets: props.datasets ?? [],
        datasetPreviews: props.datasetPreviews ?? {},
        currentEntries: current
      })
    );
  }, [props.widgets, props.datasets, props.datasetPreviews]);

  useEffect(() => {
    const loadingEntries = Object.entries(chartEntries).filter(([, entry]) => {
      return entry.state.status === "loading" && entry.queryKey;
    });

    if (loadingEntries.length === 0) {
      return;
    }

    let cancelled = false;

    for (const [widgetId, entry] of loadingEntries) {
      const widget = props.widgets.find((item) => item.id === widgetId);

      if (!widget?.config) {
        continue;
      }

      void portalApiClient
        .runDatasetChartQuery({
          datasetId: widget.config.datasetId,
          chartType:
            widget.config.chartType === "line" || widget.config.chartType === "area"
              ? widget.config.chartType
              : "bar",
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
              ? { status: "ready", payload }
              : { status: "empty" };
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
  }, [chartEntries, props.widgets]);

  const chartStates = Object.fromEntries(
    Object.entries(chartEntries).map(([widgetId, entry]) => [widgetId, entry.state])
  ) as Record<string, DashboardChartState>;

  return (
    <DashboardCanvas
        widgets={props.widgets}
        activeWidgetId={null}
        chartStates={chartStates}
        readOnly
        datasetDetails={props.datasetDetails}
      />
  );
}
