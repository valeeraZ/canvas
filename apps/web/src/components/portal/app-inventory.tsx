import React from "react";
import Link from "next/link";
import {
  AppWindow,
  ArrowRight,
  FolderClock,
  LayoutDashboard,
  type LucideIcon,
  icons
} from "lucide-react";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";

type AppInventoryItem = {
  appName: string;
  appDisplayName: string;
  appLogoName: string;
  roles: string[];
  recentDashboardName: string | null;
};

function toLucideExportName(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function resolveIcon(name: string): LucideIcon {
  const resolved = icons[toLucideExportName(name) as keyof typeof icons];
  return typeof resolved === "function" ? resolved : AppWindow;
}

export function AppInventory(props: { apps: AppInventoryItem[] }) {
  if (props.apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-sm text-muted-foreground">
        No accessible apps were returned for this principal.
      </div>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      {props.apps.map((app) => {
        const Icon = resolveIcon(app.appLogoName);

        return (
          <Card key={app.appName} className="overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border bg-muted/50 p-3 text-foreground">
                      <Icon className="size-5" />
                    </div>
                    <div className="grid gap-1">
                      <CardTitle className="text-xl">{app.appDisplayName}</CardTitle>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {app.appName}
                      </p>
                    </div>
                  </div>
                  <CardDescription>
                    Open this app to review dashboards available to you.
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
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <LayoutDashboard className="size-4 text-muted-foreground" />
                  Recent dashboard
                </div>
                <p className="text-sm font-medium">
                  {app.recentDashboardName ?? "No dashboards available yet"}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <FolderClock className="size-4" />
                  Recent activity is pinned to the top of the portal.
                </span>
                <Link
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  href={`/portal/${app.appName}`}
                >
                  <ArrowRight className="size-4" />
                  Open app
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
