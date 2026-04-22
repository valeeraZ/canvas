"use client";

import React from "react";
import type {
  TableRowsPayload,
  TableWidgetConfig
} from "../../../../../packages/contracts/src/dashboard-editor.js";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";

export type DashboardTableState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "dataset-importing" }
  | { status: "field-invalid" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; payload: TableRowsPayload };

type TableRendererWidget = {
  config: TableWidgetConfig | null;
};

function renderStateMessage(state: DashboardTableState) {
  switch (state.status) {
    case "loading":
      return "Loading table...";
    case "dataset-importing":
      return "Dataset still importing";
    case "field-invalid":
      return "Table columns are not queryable";
    case "empty":
      return "No rows returned";
    case "error":
      return state.message;
    case "idle":
    default:
      return "Configure a dataset and table columns to render this widget.";
  }
}

export function DashboardTableRenderer(props: {
  widget: TableRendererWidget;
  state: DashboardTableState;
  pending?: boolean;
  onPageChange?: (page: number) => void;
}) {
  const title = props.widget.config?.title || "Table widget";

  if (!props.widget.config || props.state.status !== "ready") {
    return (
      <div className="overflow-hidden">
        {props.pending ? (
          <p className="mb-3 text-xs font-medium text-muted-foreground">Saving...</p>
        ) : null}
        <div
          className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground"
          suppressHydrationWarning
        >
          {renderStateMessage(props.state)}
        </div>
      </div>
    );
  }

  const payload = props.state.payload;
  const pageCount = Math.max(1, Math.ceil(payload.totalRows / payload.pageSize));

  return (
    <div className="grid gap-3 overflow-hidden">
      {props.pending ? (
        <p className="text-xs font-medium text-muted-foreground">Saving...</p>
      ) : null}
      <div className="rounded-xl border border-border bg-background p-3">
        <p className="mb-2 text-sm font-medium">{title}</p>
        <Table>
          <TableHeader>
            <TableRow>
              {payload.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {payload.rows.map((row, index) => (
              <TableRow key={index}>
                {payload.columns.map((column) => (
                  <TableCell key={column}>{String(row[column] ?? "")}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{`Page ${payload.page} of ${pageCount}`}</span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={payload.page <= 1}
            onClick={() => props.onPageChange?.(payload.page - 1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={payload.page >= pageCount}
            onClick={() => props.onPageChange?.(payload.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
