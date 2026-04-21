"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, LayoutDashboard, MoreHorizontal } from "lucide-react";
import { createPortalApiClient, toPortalApiError } from "../../lib/portal/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";

const portalApiClient = createPortalApiClient();

type DashboardListItem = {
  id: string;
  appName: string;
  appDisplayName?: string;
  name: string;
  status: string;
  author: {
    externalUserId: string | null;
    displayName: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function dashboardHref(dashboard: DashboardListItem) {
  return `/portal/${dashboard.appName}/${dashboard.id}`;
}

export function DashboardList(props: {
  appName?: string;
  dashboards: DashboardListItem[];
  selectedDashboardIdByApp?: Record<string, string | null>;
  selectedDashboardId?: string | null;
  showAppColumn?: boolean;
  showDefaultEmbed?: boolean;
  actions?: React.ReactNode;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState<DashboardListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<{
    dashboard: DashboardListItem;
    left: number;
    top: number;
  } | null>(null);

  function selectedDashboardIdFor(appName: string) {
    return props.selectedDashboardIdByApp?.[appName] ?? props.selectedDashboardId ?? null;
  }

  async function setDefaultEmbed(dashboard: DashboardListItem) {
    setError(null);

    try {
      await portalApiClient.setSelectedDashboard({
        appName: dashboard.appName,
        dashboardId: dashboard.id
      });
      router.refresh();
    } catch (caught) {
      setError(toPortalApiError(caught).message);
    }
  }

  async function renameDashboard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!renaming) {
      return;
    }

    setError(null);

    try {
      await portalApiClient.renameDashboard({
        appName: renaming.appName,
        dashboardId: renaming.id,
        name: renameValue
      });
      setRenaming(null);
      router.refresh();
    } catch (caught) {
      setError(toPortalApiError(caught).message);
    }
  }

  async function removeDashboard(dashboard: DashboardListItem) {
    setError(null);
    setOpenMenu(null);

    try {
      await portalApiClient.removeDashboard({
        appName: dashboard.appName,
        dashboardId: dashboard.id
      });
      router.refresh();
    } catch (caught) {
      setError(toPortalApiError(caught).message);
    }
  }

  async function exportDashboard(dashboard: DashboardListItem) {
    setError(null);
    setOpenMenu(null);

    try {
      const payload = await portalApiClient.exportDashboard({
        appName: dashboard.appName,
        dashboardId: dashboard.id
      });
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${dashboard.name}.dashboard.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(toPortalApiError(caught).message);
    }
  }

  return (
    <section className="grid gap-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border bg-muted/60 p-2 text-muted-foreground">
                <LayoutDashboard />
              </div>
              <div>
                <CardTitle>Dashboard inventory</CardTitle>
                <CardDescription>
                  Review dashboard ownership, access status, and default embed selection.
                </CardDescription>
              </div>
            </div>
            {props.actions}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="border-b px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dashboard</TableHead>
                {props.showAppColumn ? <TableHead>App</TableHead> : null}
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                {props.showDefaultEmbed ? <TableHead>Default embed</TableHead> : null}
                <TableHead className="text-right">Menu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.dashboards.map((dashboard) => {
                const isSelected =
                  dashboard.id === selectedDashboardIdFor(dashboard.appName);

                return (
                  <TableRow
                    className="cursor-pointer"
                    key={`${dashboard.appName}-${dashboard.id}`}
                    onClick={() => router.push(dashboardHref(dashboard))}
                  >
                    <TableCell className="font-medium">
                      <Link
                        className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={dashboardHref(dashboard)}
                      >
                        {dashboard.name}
                      </Link>
                    </TableCell>
                    {props.showAppColumn ? (
                      <TableCell className="text-sm text-muted-foreground">
                        {dashboard.appDisplayName ?? dashboard.appName}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <Badge variant="outline">{dashboard.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {dashboard.author.displayName ?? dashboard.author.externalUserId ?? "Unknown"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(dashboard.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTime(dashboard.updatedAt)}
                    </TableCell>
                    {props.showDefaultEmbed ? (
                      <TableCell>
                        <Button
                          aria-label={`Set ${dashboard.name} as default embed`}
                          size="icon-sm"
                          variant="ghost"
                          onClick={(event) => {
                            event.stopPropagation();
                            void setDefaultEmbed(dashboard);
                          }}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="text-green-600" />
                          ) : (
                            <CheckCircle2 className="text-muted-foreground/35" />
                          )}
                        </Button>
                      </TableCell>
                    ) : null}
                    <TableCell className="text-right">
                      <Button
                        aria-label={`${dashboard.name} actions`}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          const rect = event.currentTarget.getBoundingClientRect();
                          const menuWidth = 144;
                          const menuHeight = 116;
                          const top =
                            rect.bottom + menuHeight + 6 > window.innerHeight
                              ? Math.max(8, rect.top - menuHeight - 6)
                              : rect.bottom + 6;
                          const left = Math.min(
                            Math.max(8, rect.right - menuWidth),
                            Math.max(8, window.innerWidth - menuWidth - 8)
                          );

                          setOpenMenu({
                            dashboard,
                            left,
                            top
                          });
                        }}
                      >
                        <MoreHorizontal />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {openMenu ? (
        <>
          <button
            aria-label="Close dashboard menu"
            className="fixed inset-0 z-40 cursor-default"
            type="button"
            onClick={() => setOpenMenu(null)}
          />
          <div
            className="fixed z-50 grid w-36 gap-1 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md"
            style={{
              left: openMenu.left,
              top: openMenu.top
            }}
          >
            <button
              className="rounded-md px-2 py-1.5 text-left hover:bg-muted"
              type="button"
              onClick={() => {
                setRenaming(openMenu.dashboard);
                setRenameValue(openMenu.dashboard.name);
                setOpenMenu(null);
              }}
            >
              Rename
            </button>
            <button
              className="rounded-md px-2 py-1.5 text-left hover:bg-muted"
              type="button"
              onClick={() => void exportDashboard(openMenu.dashboard)}
            >
              Export
            </button>
            <button
              className="rounded-md px-2 py-1.5 text-left text-destructive hover:bg-muted"
              type="button"
              onClick={() => void removeDashboard(openMenu.dashboard)}
            >
              Remove
            </button>
          </div>
        </>
      ) : null}
      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename dashboard</DialogTitle>
            <DialogDescription>
              Update the dashboard name shown in Portal and embed management.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={renameDashboard}>
            <Input
              aria-label="Dashboard name"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
            />
            <DialogFooter>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
