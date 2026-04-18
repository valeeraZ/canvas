"use client";

import React from "react";
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
};

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
}) {
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
          props.widgets.map((widget, index) => (
            <DashboardWidgetCard
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
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
