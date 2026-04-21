import React from "react";
import Link from "next/link";
import { Database, FileChartColumn } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";

export function DatasetDetail(props: {
  appName?: string | null;
  dataset: {
    id: string;
    name: string;
    status: string;
    uploadedByDisplayName?: string;
    sourceFilename?: string;
    contentType?: string;
    sizeBytes?: number;
    importStatus?: string;
    usageSummary: {
      dashboards: Array<{ id: string; name: string }>;
      widgets: Array<{
        id: string;
        dashboardId: string;
        dashboardName: string;
        type: string;
      }>;
      workbooks: Array<{ id: string; name: string }>;
    };
  };
}) {
  const { dataset } = props;

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle>Dataset metadata</CardTitle>
          <CardDescription>
            Source file and ingestion context for the selected dataset.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Uploaded by
            </div>
            <div className="mt-2 font-medium">{dataset.uploadedByDisplayName ?? "Unknown"}</div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Source file
            </div>
            <div className="mt-2 flex items-center gap-2 font-medium">
              <Database className="h-4 w-4 text-muted-foreground" />
              {dataset.sourceFilename ?? "No source file recorded"}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {dataset.contentType ?? "application/octet-stream"}
              {typeof dataset.sizeBytes === "number"
                ? ` • ${Math.max(1, Math.round(dataset.sizeBytes / 1024))} KB`
                : ""}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Import state
            </div>
            <div className="mt-2">
              <Badge variant="secondary">{dataset.importStatus ?? dataset.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Usage summary</CardTitle>
          <CardDescription>
            Dashboards, widgets, and workbooks currently referencing this dataset.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3">
            <div className="text-sm font-medium">Dashboards</div>
            {dataset.usageSummary.dashboards.length > 0 ? (
              dataset.usageSummary.dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div className="grid gap-1">
                    <div className="font-medium">{dashboard.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {dashboard.id}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={
                        props.appName
                          ? `/portal/${props.appName}/${dashboard.id}`
                          : `/portal/dashboards/${dashboard.id}`
                      }
                    >
                      Open
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No dashboards reference this dataset yet.
              </div>
            )}
          </div>
          <div className="grid gap-3">
            <div className="text-sm font-medium">Widgets</div>
            {dataset.usageSummary.widgets.length > 0 ? (
              dataset.usageSummary.widgets.map((widget) => (
                <div
                  key={widget.id}
                  className="rounded-xl border border-border p-4"
                >
                  <div className="flex items-center gap-2 font-medium">
                    <FileChartColumn className="h-4 w-4 text-muted-foreground" />
                    {widget.dashboardName}
                  </div>
                  <div className="mt-2 font-mono text-xs text-muted-foreground">
                    {widget.id}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No widgets reference this dataset yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
