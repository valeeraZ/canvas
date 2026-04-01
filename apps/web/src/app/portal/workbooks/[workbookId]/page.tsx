import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CreateDashboardDialog } from "../../../../components/portal/create-dashboard-dialog";
import { PortalShell } from "../../../../components/portal/portal-shell";
import { Badge } from "../../../../components/ui/badge";
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

export default async function PortalWorkbookDetailPage(props: {
  params: Promise<{
    workbookId: string;
  }>;
}) {
  const session = readPortalSession(await cookies());

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to review workbook details</CardTitle>
            <CardDescription>
              Workbook detail views depend on the current Canvas portal session.
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

  const { workbookId } = await props.params;
  const client = createPortalBackendClient(session);
  const [accessibleApps, workbook, workbooks, dashboards] = await Promise.all([
    client.listAccessibleApps(),
    client.getWorkbook(workbookId).catch(() => null),
    client.listWorkbooks(),
    client.listDashboards()
  ]);

  if (!workbook) {
    notFound();
  }

  const relatedDashboards = dashboards.filter(
    (dashboard) => dashboard.workbookId === workbook.id
  );

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={session.selectedApp}
      principal={session.principal}
      title={workbook.name}
      description="Use the workbook as the structural home for related dashboards in the current app."
      currentSection="workbooks"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Workbooks", href: "/portal/workbooks" },
        { label: workbook.name }
      ]}
      actions={
        <div className="flex items-center gap-2">
          <CreateDashboardDialog
            workbooks={workbooks.map((item) => ({
              id: item.id,
              name: item.name
            }))}
            defaultWorkbookId={workbook.id}
          />
          <Button asChild variant="outline">
            <Link href="/portal/workbooks">Back to workbooks</Link>
          </Button>
        </div>
      }
    >
      <section className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workbook metadata</CardTitle>
            <CardDescription>
              This workbook belongs to the active app and can host multiple dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Workbook ID
              </div>
              <div className="mt-2 font-mono text-sm">{workbook.id}</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                App
              </div>
              <div className="mt-2">
                <Badge variant="secondary">{session.selectedApp}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Related dashboards</CardTitle>
            <CardDescription>
              Dashboards currently attached to this workbook.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {relatedDashboards.length > 0 ? (
              relatedDashboards.map((dashboard) => (
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
                    <Link href={`/portal/dashboards/${dashboard.id}`}>Open</Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                No dashboards are attached yet. Create one from this workbook to
                start building the app-level view.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </PortalShell>
  );
}
