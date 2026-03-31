"use client";

import React, { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, FolderClock, LoaderCircle, LayoutDashboard } from "lucide-react";
import { createPortalApiClient } from "../../lib/portal/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";

type AppInventoryItem = {
  appName: string;
  roles: string[];
  recentDashboardName: string | null;
  recentWorkbookName: string | null;
};

export function AppInventory(props: { apps: AppInventoryItem[] }) {
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const [pendingApp, setPendingApp] = useState<string | null>(null);

  function openApp(appName: string) {
    setPendingApp(appName);

    startTransition(async () => {
      try {
        await apiClient.selectApp({
          appName
        });
        router.push("/portal/dashboards");
        router.refresh();
      } finally {
        setPendingApp(null);
      }
    });
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {props.apps.map((app) => {
        const isPending = pendingApp === app.appName;

        return (
          <Card key={app.appName} className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-1">
                  <CardTitle className="text-xl">{app.appName}</CardTitle>
                  <CardDescription>
                    Open this app to manage dashboards and workbooks.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {app.roles.map((role) => (
                    <Badge key={`${app.appName}-${role}`} variant="secondary">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-6">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <LayoutDashboard className="size-4 text-muted-foreground" />
                    Recent dashboard
                  </div>
                  <p className="text-sm font-medium">
                    {app.recentDashboardName ?? "No dashboard opened yet"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <BookOpen className="size-4 text-muted-foreground" />
                    Recent workbook
                  </div>
                  <p className="text-sm font-medium">
                    {app.recentWorkbookName ?? "No workbook opened yet"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <FolderClock className="size-4" />
                  Recent activity is pinned to the top of the portal.
                </span>
                <Button
                  type="button"
                  onClick={() => openApp(app.appName)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                  Open app
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
