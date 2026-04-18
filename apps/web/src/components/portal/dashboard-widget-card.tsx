"use client";

import React from "react";
import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import type { DashboardChartState } from "./dashboard-chart-renderer";
import { DashboardChartRenderer } from "./dashboard-chart-renderer";
import { cn } from "../../lib/utils";

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
};

export function DashboardWidgetCard(props: {
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
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    props.onSelectWidget?.(props.widget.id);
  }

  return (
    <div
      role={props.readOnly ? undefined : "button"}
      tabIndex={props.readOnly ? undefined : 0}
      data-focused-widget={props.focused ? "true" : "false"}
      onClick={props.readOnly ? undefined : () => props.onSelectWidget?.(props.widget.id)}
      onKeyDown={props.readOnly ? undefined : handleKeyDown}
      className={cn(
        "grid min-h-48 gap-4 rounded-xl border p-4 text-left transition-colors",
        props.readOnly
          ? "border-border bg-card"
          : props.focused
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/30"
      )}
    >
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            {props.widget.config?.title || `Chart widget ${props.index + 1}`}
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            {!props.readOnly && props.pending ? <span>Saving...</span> : null}
            {!props.readOnly && props.focused ? <span className="text-primary">Editing</span> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <p>{props.widget.config?.chartType ?? props.widget.type}</p>
          {props.datasetDetail ? (
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`/portal/datasets/${props.datasetDetail.id}`}
                className="truncate font-medium text-foreground hover:text-primary"
              >
                {props.datasetDetail.name}
              </Link>
              <span className="text-border">/</span>
              <Link
                href={`/portal/datasets/${props.datasetDetail.id}`}
                className="truncate hover:text-foreground"
              >
                {props.datasetDetail.sourceFilename ?? "No source file recorded"}
              </Link>
            </div>
          ) : (
            <p>No dataset linked</p>
          )}
        </div>
      </div>
      <DashboardChartRenderer
        widget={props.widget}
        state={props.chartState}
        pending={props.readOnly ? false : props.pending}
        compact
      />
    </div>
  );
}
