"use client";

import React, { useEffect, useState } from "react";
import type { DashboardChartState } from "./dashboard-chart-renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { DashboardWidgetCard } from "./dashboard-widget-card";

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

function normalizeWidgetLayout(
  widget: WidgetSummary,
  index: number
) {
  return {
    x: widget.layout?.x ?? index % 2,
    y: widget.layout?.y ?? Math.floor(index / 2),
    w: widget.layout?.w ?? 1,
    h: widget.layout?.h ?? 1
  };
}

export function sortDashboardCanvasWidgets(widgets: WidgetSummary[]) {
  return [...widgets]
    .map((widget, index) => ({
      ...widget,
      layout: normalizeWidgetLayout(widget, index)
    }))
    .sort((left, right) => {
      const leftLayout = left.layout!;
      const rightLayout = right.layout!;

      return (
        leftLayout.y - rightLayout.y ||
        leftLayout.x - rightLayout.x ||
        left.id.localeCompare(right.id)
      );
    });
}

export function previewDashboardCanvasSwap(
  widgets: WidgetSummary[],
  draggedWidgetId: string,
  targetWidgetId: string
) {
  const sortedWidgets = sortDashboardCanvasWidgets(widgets);
  const draggedWidget = sortedWidgets.find((widget) => widget.id === draggedWidgetId);
  const targetWidget = sortedWidgets.find((widget) => widget.id === targetWidgetId);

  if (!draggedWidget || !targetWidget || draggedWidget.id === targetWidget.id) {
    return sortedWidgets;
  }

  return sortDashboardCanvasWidgets(sortedWidgets.map((widget) => {
    if (widget.id === draggedWidget.id) {
      return {
        ...widget,
        layout: targetWidget.layout
      };
    }

    if (widget.id === targetWidget.id) {
      return {
        ...widget,
        layout: draggedWidget.layout
      };
    }

    return widget;
  }));
}

export function DashboardCanvas(props: {
  widgets: WidgetSummary[];
  activeWidgetId: string | null;
  savingWidgetIds?: Record<string, boolean>;
  chartStates?: Record<string, DashboardChartState>;
  readOnly?: boolean;
  datasetDetails?: Record<
    string,
    | {
        id: string;
        name: string;
        sourceFilename?: string;
      }
    | null
  >;
  onSelectWidget?: (widgetId: string) => void;
  onMoveWidget?: (widgetId: string, targetWidgetId: string) => void;
  onDeleteWidget?: (widgetId: string) => void;
}) {
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [previewWidgets, setPreviewWidgets] = useState<WidgetSummary[]>(() =>
    sortDashboardCanvasWidgets(props.widgets)
  );

  useEffect(() => {
    setPreviewWidgets(sortDashboardCanvasWidgets(props.widgets));
  }, [props.widgets]);

  const widgets = draggedWidgetId ? previewWidgets : sortDashboardCanvasWidgets(props.widgets);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dashboard canvas</CardTitle>
        <CardDescription>
          Review every chart widget while keeping one active edit focus.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {props.widgets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8">
            <div className="grid gap-2">
              <p className="text-base font-medium">Select a chart widget</p>
              <p className="text-sm text-muted-foreground">
                Add or select a widget to render real imported data here.
              </p>
            </div>
          </div>
        ) : (
          widgets.map((widget, index) => (
            <DashboardWidgetCard
              key={widget.id}
              widget={widget}
              index={index}
              focused={props.activeWidgetId === widget.id}
              pending={Boolean(props.savingWidgetIds?.[widget.id])}
              chartState={props.chartStates?.[widget.id] ?? { status: "idle" }}
              readOnly={props.readOnly}
              draggable={!props.readOnly}
              datasetDetail={
                widget.datasetId ? props.datasetDetails?.[widget.datasetId] ?? null : null
              }
              onSelectWidget={props.onSelectWidget}
              onDragStart={(widgetId) => {
                setDraggedWidgetId(widgetId);
                setPreviewWidgets(sortDashboardCanvasWidgets(props.widgets));
              }}
              onDragOverWidget={(targetWidgetId) => {
                if (!draggedWidgetId) {
                  return;
                }

                setPreviewWidgets(
                  previewDashboardCanvasSwap(props.widgets, draggedWidgetId, targetWidgetId)
                );
              }}
              onDropWidget={(targetWidgetId) => {
                if (draggedWidgetId && draggedWidgetId !== targetWidgetId) {
                  props.onMoveWidget?.(draggedWidgetId, targetWidgetId);
                }

                setDraggedWidgetId(null);
                setPreviewWidgets(sortDashboardCanvasWidgets(props.widgets));
              }}
              onDeleteWidget={props.onDeleteWidget}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
