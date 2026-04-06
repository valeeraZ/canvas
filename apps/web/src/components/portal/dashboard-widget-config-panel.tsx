"use client";

import React, { useEffect, useState } from "react";
import type { ChartWidgetConfig, DatasetPreview } from "../../../../../packages/contracts/src/dashboard-editor.js";
import type { DashboardWidgetRecord } from "../../../../../packages/contracts/src/widgets.js";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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

function buildInitialConfig(
  widget: DashboardWidgetRecord | null,
  previews: Record<string, DatasetPreview | null>,
  datasets: DatasetOption[]
): ChartWidgetConfig | null {
  if (widget?.config) {
    return widget.config;
  }

  const datasetId = widget?.datasetId ?? datasets[0]?.id;

  if (!datasetId) {
    return null;
  }

  const preview = previews[datasetId];
  const columns = preview?.columns ?? [];

  return {
    datasetId,
    chartType: "bar",
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
    setDraft(buildInitialConfig(props.widget, props.previews, props.datasets));
  }, [props.widget, props.previews, props.datasets]);

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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Configure widget</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
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
          <Label>Dataset</Label>
          <Select
            value={draft?.datasetId}
            onValueChange={(value) => {
              const nextPreview = props.previews[value];
              const nextColumns = nextPreview?.columns ?? [];
              updateDraft({
                datasetId: value,
                xField: nextColumns[0]?.name ?? "",
                yField:
                  nextColumns.find(
                    (column: DatasetPreview["columns"][number]) =>
                      column.type === "number"
                  )?.name ??
                  nextColumns[1]?.name ??
                  ""
              });
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
          <Label>Chart type</Label>
          <Select
            value={draft?.chartType}
            onValueChange={(value) =>
              updateDraft({
                chartType: value as ChartWidgetConfig["chartType"]
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="pie">Pie</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>X axis</Label>
          <Select
            value={draft?.xField}
            onValueChange={(value) => updateDraft({ xField: value })}
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
            onValueChange={(value) => updateDraft({ yField: value })}
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
        <div className="grid gap-2">
          <Label>Series</Label>
          <Select
            value={draft?.seriesField ?? "__none__"}
            onValueChange={(value) =>
              updateDraft({ seriesField: value === "__none__" ? undefined : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No split series" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No split series</SelectItem>
              {fields.map((field: DatasetPreview["columns"][number]) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          disabled={
            props.pending ||
            !draft?.datasetId ||
            !draft.xField ||
            !draft.yField
          }
          onClick={() => draft && props.onSave(props.widget!.id, draft)}
        >
          Save widget
        </Button>
      </CardContent>
    </Card>
  );
}
