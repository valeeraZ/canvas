import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
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
import { readPortalSession } from "../../../lib/portal/session";

export default async function PortalDashboardsPage() {
  const session = readPortalSession(await cookies());

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to manage dashboards</CardTitle>
            <CardDescription>
              The dashboard inventory uses the current Canvas portal session.
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

  const client = createPortalBackendClient(session);
  const [accessibleApps, dashboards, selected] = await Promise.all([
    client.listAccessibleApps(),
    client.listDashboards(),
    client.getSelectedDashboard()
  ]);

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={session.selectedApp}
      principal={session.principal}
      title="Dashboards"
      description="Inspect the dashboard inventory for the active app, then drill into sharing and embed selection."
      currentSection="dashboards"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Dashboards" }
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href="/portal">Back to portal</Link>
        </Button>
      }
    >
      <DashboardList
        dashboards={dashboards.map((dashboard) => ({
          id: dashboard.id,
          name: dashboard.name
        }))}
        selectedDashboardId={selected.dashboardId}
      />
    </PortalShell>
  );
}
