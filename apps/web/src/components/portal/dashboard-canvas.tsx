"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

  const nextWidgets = [...sortedWidgets];
  const sourceIndex = nextWidgets.findIndex((widget) => widget.id === draggedWidgetId);
  const targetIndex = nextWidgets.findIndex((widget) => widget.id === targetWidgetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return sortedWidgets;
  }

  const [dragged] = nextWidgets.splice(sourceIndex, 1);

  if (!dragged) {
    return sortedWidgets;
  }

  nextWidgets.splice(targetIndex, 0, dragged);

  return nextWidgets.map((widget, index) => ({
    ...widget,
    layout: {
      x: index % 2,
      y: Math.floor(index / 2),
      w: 1,
      h: 1
    }
  }));
}

export function resolvePreviewMoveTargetWidgetId(input: {
  widgets: WidgetSummary[];
  previewWidgets: WidgetSummary[];
  draggedWidgetId: string;
}) {
  const originalWidgets = sortDashboardCanvasWidgets(input.widgets);
  const nextWidgets = sortDashboardCanvasWidgets(input.previewWidgets);
  const originalOrder = originalWidgets.map((widget) => widget.id).join("|");
  const nextOrder = nextWidgets.map((widget) => widget.id).join("|");

  if (originalOrder === nextOrder) {
    return null;
  }

  const movedWidget = nextWidgets.find((widget) => widget.id === input.draggedWidgetId);

  if (!movedWidget?.layout) {
    return null;
  }

  return (
    originalWidgets.find((widget) => {
      return (
        widget.id !== input.draggedWidgetId &&
        widget.layout.x === movedWidget.layout!.x &&
        widget.layout.y === movedWidget.layout!.y
      );
    })?.id ?? null
  );
}

export function resolveCommittedMoveTargetWidgetId(input: {
  draggedWidgetId: string;
  previewTargetWidgetId?: string | null;
  explicitTargetWidgetId?: string | null;
  lastOverWidgetId?: string | null;
}) {
  if (input.previewTargetWidgetId && input.previewTargetWidgetId !== input.draggedWidgetId) {
    return input.previewTargetWidgetId;
  }

  if (input.explicitTargetWidgetId && input.explicitTargetWidgetId !== input.draggedWidgetId) {
    return input.explicitTargetWidgetId;
  }

  if (input.lastOverWidgetId && input.lastOverWidgetId !== input.draggedWidgetId) {
    return input.lastOverWidgetId;
  }

  return null;
}

function SortableWidgetCard(props: {
  widget: WidgetSummary;
  index: number;
  focused: boolean;
  pending: boolean;
  chartState: DashboardChartState;
  readOnly?: boolean;
  datasetDetail?: {
    id: string;
    name: string;
    sourceFilename?: string;
  } | null;
  onSelectWidget?: (widgetId: string) => void;
  onDeleteWidget?: (widgetId: string) => void;
}) {
  const { listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({
    id: props.widget.id,
    disabled: props.readOnly
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition
      }}
      className={isDragging ? "z-20" : undefined}
    >
      <DashboardWidgetCard
        {...props}
        dragHandleRef={props.readOnly ? undefined : setActivatorNodeRef}
        dragHandleProps={props.readOnly ? undefined : listeners}
      />
    </div>
  );
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
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );
  const lastOverWidgetIdRef = useRef<string | null>(null);
  const committedTargetWidgetIdRef = useRef<string | null>(null);
  const activeDraggedWidgetIdRef = useRef<string | null>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [previewWidgets, setPreviewWidgets] = useState<WidgetSummary[]>(() =>
    sortDashboardCanvasWidgets(props.widgets)
  );

  useEffect(() => {
    setPreviewWidgets(sortDashboardCanvasWidgets(props.widgets));
  }, [props.widgets]);

  const widgets = draggedWidgetId ? previewWidgets : sortDashboardCanvasWidgets(props.widgets);

  function commitDrag(activeId: string, explicitTargetId?: string | null) {
    const targetWidgetId = resolveCommittedMoveTargetWidgetId({
      draggedWidgetId: activeId,
      previewTargetWidgetId: committedTargetWidgetIdRef.current,
      explicitTargetWidgetId: explicitTargetId,
      lastOverWidgetId: lastOverWidgetIdRef.current
    });

    if (targetWidgetId && targetWidgetId !== activeId) {
      props.onMoveWidget?.(activeId, targetWidgetId);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dashboard canvas</CardTitle>
        <CardDescription>
          Review every chart widget while keeping one active edit focus.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <DndContext
            id="dashboard-canvas-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => {
              const activeId = String(event.active.id);
              activeDraggedWidgetIdRef.current = activeId;
              setDraggedWidgetId(activeId);
              lastOverWidgetIdRef.current = null;
              committedTargetWidgetIdRef.current = null;
            }}
            onDragOver={(event) => {
              const overId = event.over?.id ? String(event.over.id) : null;
              const activeId = String(event.active.id);

              if (!overId || overId === activeId) {
                return;
              }

              lastOverWidgetIdRef.current = overId;
              const nextPreviewWidgets = previewDashboardCanvasSwap(props.widgets, activeId, overId);
              committedTargetWidgetIdRef.current = resolvePreviewMoveTargetWidgetId({
                widgets: props.widgets,
                previewWidgets: nextPreviewWidgets,
                draggedWidgetId: activeId
              });
              setPreviewWidgets(nextPreviewWidgets);
            }}
            onDragCancel={() => {
              if (activeDraggedWidgetIdRef.current) {
                commitDrag(activeDraggedWidgetIdRef.current, lastOverWidgetIdRef.current);
              }

              activeDraggedWidgetIdRef.current = null;
              setDraggedWidgetId(null);
              lastOverWidgetIdRef.current = null;
              committedTargetWidgetIdRef.current = null;
              setPreviewWidgets(sortDashboardCanvasWidgets(props.widgets));
            }}
            onDragEnd={(event) => {
              const overId = event.over?.id
                ? String(event.over.id)
                : lastOverWidgetIdRef.current;
              const activeId = String(event.active.id);

              commitDrag(activeId, overId);

              activeDraggedWidgetIdRef.current = null;
              setDraggedWidgetId(null);
              lastOverWidgetIdRef.current = null;
              committedTargetWidgetIdRef.current = null;
              setPreviewWidgets(sortDashboardCanvasWidgets(props.widgets));
            }}
          >
            <SortableContext items={widgets.map((widget) => widget.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-4 md:grid-cols-2">
                {widgets.map((widget, index) => (
                  <SortableWidgetCard
                    key={widget.id}
                    widget={widget}
                    index={index}
                    focused={props.activeWidgetId === widget.id}
                    pending={Boolean(props.savingWidgetIds?.[widget.id])}
                    chartState={props.chartStates?.[widget.id] ?? { status: "idle" }}
                    readOnly={props.readOnly}
                    datasetDetail={
                      widget.datasetId ? props.datasetDetails?.[widget.datasetId] ?? null : null
                    }
                    onSelectWidget={props.onSelectWidget}
                    onDeleteWidget={props.onDeleteWidget}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
