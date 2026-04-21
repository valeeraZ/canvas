import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CreateDashboardDialog } from "../../../components/portal/create-dashboard-dialog";
import { DashboardList } from "../../../components/portal/dashboard-list";
import { PortalShell } from "../../../components/portal/portal-shell";
import { createPortalBackendClient } from "../../../lib/portal/backend-client";
import { scopePortalSession } from "../../../lib/portal/app-scope";
import { readPortalSession } from "../../../lib/portal/session";

export default async function PortalDashboardsPage() {
  const session = readPortalSession(await cookies());

  if (!session) {
    redirect("/portal/login");
  }

  const authClient = createPortalBackendClient(session);
  const accessibleApps = await authClient.listAccessibleApps();
  const dashboardGroups = await Promise.all(
    accessibleApps.apps.map(async (app) => {
      const scopedClient = createPortalBackendClient(
        scopePortalSession(session, app.appName)
      );
      const [dashboards, selected] = await Promise.all([
        scopedClient.listDashboards(),
        scopedClient.getSelectedDashboard().catch(() => ({
          dashboardId: null
        }))
      ]);

      return {
        app,
        dashboards,
        selectedDashboardId: selected.dashboardId
      };
    })
  );
  const selectedDashboardIdByApp = Object.fromEntries(
    dashboardGroups.map((group) => [
      group.app.appName,
      group.selectedDashboardId
    ])
  );
  const dashboards = dashboardGroups.flatMap((group) =>
    group.dashboards.map((dashboard) => ({
      id: dashboard.id,
      appName: group.app.appName,
      appDisplayName: group.app.appDisplayName,
      name: dashboard.name,
      status: dashboard.status,
      author: dashboard.author,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt
    }))
  );

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={null}
      principal={session.principal}
      title="Dashboards"
      description="Review dashboards you created or can access across all accessible apps."
      currentSection="dashboards"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Dashboards" }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <CreateDashboardDialog
            apps={accessibleApps.apps.map((app) => ({
              appName: app.appName,
              appDisplayName: app.appDisplayName
            }))}
          />
          <Link
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            href="/portal"
          >
            Back to portal
          </Link>
        </div>
      }
    >
      <DashboardList
        dashboards={dashboards}
        selectedDashboardIdByApp={selectedDashboardIdByApp}
        showAppColumn
      />
    </PortalShell>
  );
}
