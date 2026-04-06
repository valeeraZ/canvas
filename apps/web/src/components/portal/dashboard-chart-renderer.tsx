"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DatasetPreview } from "../../../../../packages/contracts/src/dashboard-editor.js";
import type { DashboardWidgetRecord } from "../../../../../packages/contracts/src/widgets.js";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { buildChartRenderModel } from "./chart-adapters";
import { cn } from "../../lib/utils";

const CHART_COLORS = ["#0f766e", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

export function DashboardChartRenderer(props: {
  widget: DashboardWidgetRecord;
  preview: DatasetPreview | null;
  active: boolean;
  onSelect: () => void;
}) {
  const config = props.widget.config;

  if (!config || !props.preview) {
    return (
      <button type="button" onClick={props.onSelect} className="text-left">
        <Card
          className={cn(
            "h-full transition-colors",
            props.active ? "border-primary bg-primary/5" : ""
          )}
        >
          <CardHeader>
            <CardTitle className="text-base">
              {config?.title || "Chart widget"}
            </CardTitle>
          </CardHeader>
          <CardContent className="rounded-b-xl">
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
              Configure a dataset and chart fields to render this widget.
            </div>
          </CardContent>
        </Card>
      </button>
    );
  }

  const model = buildChartRenderModel({
    chartType: config.chartType,
    xField: config.xField,
    yField: config.yField,
    seriesField: config.seriesField,
    records: props.preview.records
  });

  return (
    <button type="button" onClick={props.onSelect} className="text-left">
      <Card
        className={cn(
          "h-full transition-colors",
          props.active ? "border-primary bg-primary/5" : ""
        )}
      >
        <CardHeader>
          <CardTitle className="text-base">
            {config.title || `${config.chartType} chart`}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-hidden">
          <div className="rounded-xl border border-border bg-background p-3">
            {config.chartType === "bar" ? (
              <BarChart width={420} height={240} data={model.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={config.xField} />
                <YAxis />
                <Tooltip />
                <Legend />
                {(model.seriesKeys.length > 0 ? model.seriesKeys : [config.yField]).map(
                  (key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  )
                )}
              </BarChart>
            ) : null}
            {config.chartType === "line" ? (
              <LineChart width={420} height={240} data={model.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={config.xField} />
                <YAxis />
                <Tooltip />
                <Legend />
                {(model.seriesKeys.length > 0 ? model.seriesKeys : [config.yField]).map(
                  (key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                    />
                  )
                )}
              </LineChart>
            ) : null}
            {config.chartType === "area" ? (
              <AreaChart width={420} height={240} data={model.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={config.xField} />
                <YAxis />
                <Tooltip />
                <Legend />
                {(model.seriesKeys.length > 0 ? model.seriesKeys : [config.yField]).map(
                  (key, index) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      fillOpacity={0.25}
                    />
                  )
                )}
              </AreaChart>
            ) : null}
            {config.chartType === "pie" ? (
              <PieChart width={420} height={240}>
                <Tooltip />
                <Legend />
                <Pie
                  data={model.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {model.data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
