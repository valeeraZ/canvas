"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis
} from "recharts";
import type { ChartPayload } from "../../../../../packages/contracts/src/charts.js";
import type { ChartWidgetConfig } from "../../../../../packages/contracts/src/dashboard-editor.js";
import { cn } from "../../lib/utils";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "../ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  buildCategoricalChartRenderModel,
  buildChartRenderModel
} from "./chart-adapters";

export type DashboardChartState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "dataset-importing" }
  | { status: "field-invalid" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; payload: ChartPayload };

type ChartRendererWidget = {
  config: ChartWidgetConfig | null;
};

function renderStateMessage(state: DashboardChartState) {
  switch (state.status) {
    case "loading":
      return "Loading chart...";
    case "dataset-importing":
      return "Dataset still importing";
    case "field-invalid":
      return "Field not queryable";
    case "empty":
      return "No rows returned";
    case "error":
      return state.message;
    case "idle":
    default:
      return "Configure a dataset and chart fields to render this widget.";
  }
}

export function DashboardChartRenderer(props: {
  widget: ChartRendererWidget;
  state: DashboardChartState;
  compact?: boolean;
  pending?: boolean;
}) {
  const config = props.widget.config;
  const content = (
    <div className="overflow-hidden">
      {props.pending ? (
        <p className="mb-3 text-xs font-medium text-muted-foreground">Saving...</p>
      ) : null}
      {!config || props.state.status !== "ready" ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          {renderStateMessage(props.state)}
        </div>
      ) : (
        <DashboardChartFigure
          chartType={config.chartType}
          payload={props.state.payload}
          compact={props.compact}
        />
      )}
    </div>
  );

  if (props.compact) {
    return content;
  }

  return (
    <Card className={cn("h-full", props.state.status === "ready" && "border-primary/40")}>
      <CardHeader>
        <CardTitle className="text-base">
          {config?.title || "Chart widget"}
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

function DashboardChartFigure(props: {
  chartType: ChartWidgetConfig["chartType"];
  payload: ChartPayload;
  compact?: boolean;
}) {
  const model = buildChartRenderModel(props.payload);
  const categoricalModel = buildCategoricalChartRenderModel(props.payload);

  return (
    <div
      data-chart="dashboard-widget-chart"
      data-chart-type={props.chartType}
      className="rounded-xl border border-border bg-background p-3"
    >
      <ChartContainer
        id="dashboard-widget"
        config={model.config}
        className={cn("w-full", props.compact ? "min-h-[180px]" : "min-h-[240px]")}
      >
        {props.chartType === "bar" ? (
          <BarChart accessibilityLayer data={model.data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={model.labelKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {model.seriesKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        ) : null}
        {props.chartType === "line" ? (
          <LineChart accessibilityLayer data={model.data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={model.labelKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {model.seriesKeys.map((key) => (
              <Line
                key={key}
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
                type="monotone"
              />
            ))}
          </LineChart>
        ) : null}
        {props.chartType === "area" ? (
          <AreaChart accessibilityLayer data={model.data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey={model.labelKey} tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            {model.seriesKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                stroke={`var(--color-${key})`}
                fill={`var(--color-${key})`}
                fillOpacity={0.22}
                type="monotone"
              />
            ))}
          </AreaChart>
        ) : null}
        {props.chartType === "pie" ? (
          <PieChart accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent nameKey={categoricalModel.valueKey} />} />
            <Pie
              data={categoricalModel.data}
              dataKey={categoricalModel.valueKey}
              nameKey={categoricalModel.labelKey}
              outerRadius={props.compact ? 64 : 86}
            />
          </PieChart>
        ) : null}
        {props.chartType === "radar" ? (
          <RadarChart accessibilityLayer data={categoricalModel.data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={categoricalModel.labelKey} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Radar
              dataKey={categoricalModel.valueKey}
              fill="var(--color-value)"
              fillOpacity={0.22}
              stroke="var(--color-value)"
              strokeWidth={2}
            />
          </RadarChart>
        ) : null}
        {props.chartType === "radial" ? (
          <RadialBarChart
            accessibilityLayer
            data={categoricalModel.data}
            innerRadius={props.compact ? 24 : 36}
            outerRadius={props.compact ? 82 : 108}
          >
            <ChartTooltip content={<ChartTooltipContent nameKey={categoricalModel.valueKey} />} />
            <RadialBar
              dataKey={categoricalModel.valueKey}
              background
              cornerRadius={4}
            />
          </RadialBarChart>
        ) : null}
      </ChartContainer>
    </div>
  );
}
