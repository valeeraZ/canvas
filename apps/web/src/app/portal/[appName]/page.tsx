import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CreateDashboardDialog } from "../../../components/portal/create-dashboard-dialog";
import { DashboardList } from "../../../components/portal/dashboard-list";
import { PortalShell } from "../../../components/portal/portal-shell";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../../components/ui/card";
import { createPortalBackendClient } from "../../../lib/portal/backend-client";
import { scopePortalSession } from "../../../lib/portal/app-scope";
import { readPortalSession } from "../../../lib/portal/session";

export default async function PortalAppDashboardsPage(props: {
  params: Promise<{
    appName: string;
  }>;
}) {
  const session = readPortalSession(await cookies());

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to manage dashboards</CardTitle>
            <CardDescription>
              App dashboard views require a Canvas portal session.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/portal/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { appName } = await props.params;
  const scopedSession = scopePortalSession(session, appName);
  const client = createPortalBackendClient(scopedSession);
  const [accessibleApps, dashboards, selected] = await Promise.all([
    client.listAccessibleApps(),
    client.listDashboards(),
    client.getSelectedDashboard()
  ]);
  const activeApp = accessibleApps.apps.find((app) => app.appName === appName);

  if (!activeApp) {
    notFound();
  }

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={activeApp.appDisplayName}
      principal={session.principal}
      title={activeApp.appDisplayName}
      description="Inspect dashboards available inside this app and open one directly by URL."
      currentSection="dashboards"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: activeApp.appDisplayName }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <CreateDashboardDialog appName={appName} />
          <Button asChild variant="outline">
            <Link href="/portal">Back to portal</Link>
          </Button>
        </div>
      }
    >
      <DashboardList
        appName={appName}
        dashboards={dashboards.map((dashboard) => ({
          id: dashboard.id,
          name: dashboard.name
        }))}
        selectedDashboardId={selected.dashboardId}
        actions={<CreateDashboardDialog appName={appName} />}
      />
    </PortalShell>
  );
}
