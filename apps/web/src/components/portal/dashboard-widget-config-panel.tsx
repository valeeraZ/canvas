"use client";

import React, { useEffect, useState } from "react";
import type { ChartWidgetConfig, DatasetPreview } from "../../../../../packages/contracts/src/dashboard-editor.js";
import type { DashboardWidgetRecord } from "../../../../../packages/contracts/src/widgets.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";

type DatasetOption = {
  id: string;
  name: string;
  status: string;
};

export const CONFIG_PANEL_GROUPS = ["Chart", "Data", "Meta"] as const;
export const WIDGET_TITLE_AUTOSAVE_DELAY_MS = 500;

export function areChartWidgetConfigsEqual(
  left: ChartWidgetConfig | null,
  right: ChartWidgetConfig | null
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
    (left.title ?? "") === (right.title ?? "")
  );
}

function getSupportedChartType(
  chartType?: ChartWidgetConfig["chartType"]
): "bar" | "line" | "area" {
  if (chartType === "line" || chartType === "area") {
    return chartType;
  }

  return "bar";
}

function buildInitialConfig(
  widget: DashboardWidgetRecord | null,
  previews: Record<string, DatasetPreview | null>,
  datasets: DatasetOption[]
): ChartWidgetConfig | null {
  if (widget?.config) {
    return {
      ...widget.config,
      chartType: getSupportedChartType(widget.config.chartType),
      seriesField: undefined
    };
  }

  const datasetId = widget?.datasetId ?? datasets[0]?.id;

  if (!datasetId) {
    return null;
  }

  const preview = previews[datasetId];
  const columns = preview?.columns ?? [];

  return {
    datasetId,
    chartType: getSupportedChartType(widget?.config?.chartType),
    xField: columns[0]?.name ?? "",
    yField:
      columns.find(
        (column: DatasetPreview["columns"][number]) => column.type === "number"
      )?.name ??
      columns[1]?.name ??
      "",
    title: ""
  };
}

export function buildDatasetConfigUpdate(input: {
  current: ChartWidgetConfig;
  datasetId: string;
  preview: DatasetPreview | null | undefined;
}): ChartWidgetConfig {
  const nextColumns = input.preview?.columns ?? [];

  return {
    ...input.current,
    datasetId: input.datasetId,
    xField: nextColumns[0]?.name ?? "",
    yField:
      nextColumns.find(
        (column: DatasetPreview["columns"][number]) => column.type === "number"
      )?.name ??
      nextColumns[1]?.name ??
      ""
  };
}

export function shouldResetWidgetConfigDraft(input: {
  currentDraft: ChartWidgetConfig | null;
  widget: DashboardWidgetRecord | null;
  previews: Record<string, DatasetPreview | null>;
  datasets: DatasetOption[];
}) {
  const nextDraft = buildInitialConfig(input.widget, input.previews, input.datasets);

  return !areChartWidgetConfigsEqual(input.currentDraft, nextDraft);
}

export function DashboardWidgetConfigPanel(props: {
  widget: DashboardWidgetRecord | null;
  datasets: DatasetOption[];
  previews: Record<string, DatasetPreview | null>;
  pending: boolean;
  onSave: (widgetId: string, config: ChartWidgetConfig) => void;
}) {
  const [draft, setDraft] = useState<ChartWidgetConfig | null>(
    buildInitialConfig(props.widget, props.previews, props.datasets)
  );

  useEffect(() => {
    setDraft((current) => {
      const next = buildInitialConfig(props.widget, props.previews, props.datasets);
      return areChartWidgetConfigsEqual(current, next) ? current : next;
    });
  }, [props.widget, props.previews, props.datasets]);

  useEffect(() => {
    if (!props.widget || !draft) {
      return;
    }

    if ((draft.title ?? "") === (props.widget.config?.title ?? "")) {
      return;
    }

    const timeout = window.setTimeout(() => {
      props.onSave(props.widget!.id, draft);
    }, WIDGET_TITLE_AUTOSAVE_DELAY_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [draft, props.widget, props.onSave]);

  if (!props.widget) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Configure widget</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select a widget to edit its dataset and chart fields.
        </CardContent>
      </Card>
    );
  }

  const preview = draft?.datasetId ? props.previews[draft.datasetId] : null;
  const fields: DatasetPreview["columns"] = preview?.columns ?? [];

  function updateDraft(partial: Partial<ChartWidgetConfig>) {
    setDraft((current: ChartWidgetConfig | null) => {
      const next = current ?? buildInitialConfig(props.widget, props.previews, props.datasets);
      return next ? { ...next, ...partial } : next;
    });
  }

  function saveNextConfig(next: ChartWidgetConfig) {
    if (!props.widget) {
      return;
    }

    props.onSave(props.widget.id, next);
  }

  function saveNextConfigDeferred(next: ChartWidgetConfig) {
    window.setTimeout(() => {
      saveNextConfig(next);
    }, 0);
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Configure widget</CardTitle>
        <CardDescription>Changes save automatically while you edit.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <section className="grid gap-3">
          <div className="grid gap-1">
            <p className="text-sm font-medium">Chart</p>
            <p className="text-xs text-muted-foreground">
              Choose how this widget should render.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Chart type</Label>
            <Select
              value={draft?.chartType}
              onValueChange={(value) => {
                const next =
                  draft
                    ? {
                        ...draft,
                        chartType: value as ChartWidgetConfig["chartType"]
                      }
                    : null;
                updateDraft({
                  chartType: value as ChartWidgetConfig["chartType"]
                });
                if (next) {
                  saveNextConfigDeferred(next);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Supports bar, line, and area in this phase. Pie charts coming later.
            </p>
          </div>
        </section>
        <section className="grid gap-3">
          <div className="grid gap-1">
            <p className="text-sm font-medium">Data</p>
            <p className="text-xs text-muted-foreground">
              Bind the widget to a dataset and chart fields.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Dataset</Label>
            <Select
              value={draft?.datasetId}
              onValueChange={(value) => {
                if (!draft) {
                  return;
                }

                const next = buildDatasetConfigUpdate({
                  current: draft,
                  datasetId: value,
                  preview: props.previews[value]
                });

                setDraft(next);
                saveNextConfigDeferred(next);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                {props.datasets.map((dataset: DatasetOption) => (
                  <SelectItem key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>X axis</Label>
            <Select
              value={draft?.xField}
              onValueChange={(value) => {
                if (!draft) {
                  return;
                }

                const next = { ...draft, xField: value };
                setDraft(next);
                saveNextConfigDeferred(next);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select x field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field: DatasetPreview["columns"][number]) => (
                  <SelectItem key={field.name} value={field.name}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Y axis</Label>
            <Select
              value={draft?.yField}
              onValueChange={(value) => {
                if (!draft) {
                  return;
                }

                const next = { ...draft, yField: value };
                setDraft(next);
                saveNextConfigDeferred(next);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select y field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((field: DatasetPreview["columns"][number]) => (
                  <SelectItem key={field.name} value={field.name}>
                    {field.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
        <section className="grid gap-3">
          <div className="grid gap-1">
            <p className="text-sm font-medium">Meta</p>
            <p className="text-xs text-muted-foreground">
              Tune the widget label and future metadata.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="widget-title">Title</Label>
            <Input
              id="widget-title"
              value={draft?.title ?? ""}
              onChange={(event) => updateDraft({ title: event.target.value })}
              placeholder="Revenue trend"
            />
          </div>
          <div className="grid gap-2">
            <Label>Series</Label>
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Series split coming later.
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {props.pending ? "Saving..." : "Changes save automatically."}
          </p>
        </section>
      </CardContent>
    </Card>
  );
}
