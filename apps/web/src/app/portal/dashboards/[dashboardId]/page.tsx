import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DashboardEditor } from "../../../../components/portal/dashboard-editor";
import { PortalShell } from "../../../../components/portal/portal-shell";
import { Button } from "../../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../../../components/ui/card";
import { createPortalBackendClient } from "../../../../lib/portal/backend-client";
import { readPortalSession } from "../../../../lib/portal/session";

export default async function PortalDashboardDetailPage(props: {
  params: Promise<{
    dashboardId: string;
  }>;
}) {
  const session = readPortalSession(await cookies());

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to view dashboard details</CardTitle>
            <CardDescription>
              Detail views depend on the current Canvas portal session.
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

  const { dashboardId } = await props.params;
  const client = createPortalBackendClient(session);
  const [dashboard, selected, share] = await Promise.all([
    client.getDashboard(dashboardId).catch(() => null),
    client.getSelectedDashboard(),
    client.getDashboardShare(dashboardId)
  ]);

  if (!dashboard) {
    notFound();
  }

  return (
    <PortalShell
      apps={[session.selectedApp, "canvas", "canvas-ops"].filter(
        (value, index, items) => items.indexOf(value) === index
      )}
      currentApp={session.selectedApp}
      principal={session.principal}
      title={dashboard.name}
      description="Review embed selection, sharing visibility, and transfer operations for this dashboard."
      currentSection="dashboards"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Dashboards", href: "/portal/dashboards" },
        { label: dashboard.name }
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href="/portal/dashboards">Back to dashboards</Link>
        </Button>
      }
    >
      <DashboardEditor
        dashboard={dashboard}
        selectedDashboardId={selected.dashboardId}
        shareSubjects={share.subjects}
      />
    </PortalShell>
  );
}
