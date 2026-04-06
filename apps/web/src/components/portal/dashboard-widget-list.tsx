"use client";

import React from "react";
import { LayoutTemplate, Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { cn } from "../../lib/utils";

type WidgetSummary = {
  id: string;
  type: "chart" | "table" | "metric" | "text";
  config: {
    chartType: "bar" | "line" | "area" | "pie";
    title?: string;
  } | null;
};

export function DashboardWidgetList(props: {
  widgets: WidgetSummary[];
  activeWidgetId: string | null;
  pending: boolean;
  canAddChart: boolean;
  addChartHint?: string;
  onSelectWidget: (widgetId: string) => void;
  onAddChart: () => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">Widgets</CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={props.onAddChart}
          disabled={props.pending || !props.canAddChart}
        >
          <Plus className="h-4 w-4" />
          Add chart
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        {!props.canAddChart && props.addChartHint ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            {props.addChartHint}
          </div>
        ) : null}
        {props.widgets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Add the first chart widget to start building this dashboard.
          </div>
        ) : null}
        {props.widgets.map((widget, index) => (
          <button
            key={widget.id}
            type="button"
            onClick={() => props.onSelectWidget(widget.id)}
            className={cn(
              "grid gap-1 rounded-xl border px-3 py-3 text-left transition-colors",
              props.activeWidgetId === widget.id
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-muted/40"
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
              {widget.config?.title || `Chart widget ${index + 1}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {widget.config?.chartType ?? widget.type}
            </p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
