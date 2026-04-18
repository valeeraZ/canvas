import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DashboardEditor } from "../../../../components/portal/dashboard-editor";
import { DashboardPreview } from "../../../../components/portal/dashboard-preview";
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
  searchParams?: Promise<{
    mode?: string;
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
  const searchParams = await props.searchParams;
  const isEditMode = searchParams?.mode === "edit";
  const client = createPortalBackendClient(session);
  const [accessibleApps, dashboard, selected, share, widgets, datasets] =
    await Promise.all([
      client.listAccessibleApps().catch(() => ({
        principal: {
          displayName: session.principal.displayName,
          employeeId: session.principal.employeeId
        },
        apps: [
          {
            appName: session.selectedApp,
            roles: session.principal.roles
          }
        ]
      })),
      client.getDashboard(dashboardId).catch(() => null),
      client.getSelectedDashboard().catch(() => ({
        dashboardId: null
      })),
      client.getDashboardShare(dashboardId).catch(() => ({
        dashboardId,
        subjects: [],
        rules: []
      })),
      client.listDashboardWidgets(dashboardId).catch(() => []),
      client.listDatasets().catch(() => [])
    ]);

  if (!dashboard) {
    notFound();
  }

  const datasetPreviews = Object.fromEntries(
    await Promise.all(
      datasets.map(async (dataset) => [
        dataset.id,
        await client.getDatasetPreview(dataset.id).catch(() => null)
      ])
    )
  ) as Record<string, Awaited<ReturnType<typeof client.getDatasetPreview>> | null>;

  const linkedDatasetIds = Array.from(
    new Set(
      widgets
        .map((widget) => widget.datasetId)
        .filter((datasetId): datasetId is string => Boolean(datasetId))
    )
  );
  const datasetDetails = Object.fromEntries(
    await Promise.all(
      linkedDatasetIds.map(async (datasetId) => {
        const detail = await client.getDataset(datasetId).catch(() => null);

        return [
          datasetId,
          detail
            ? {
                id: detail.id,
                name: detail.name,
                sourceFilename: detail.sourceFilename
              }
            : null
        ];
      })
    )
  ) as Record<
    string,
    | {
        id: string;
        name: string;
        sourceFilename?: string;
      }
    | null
  >;

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
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
        <>
          <Button asChild variant="outline">
            <Link href="/portal/dashboards">Back</Link>
          </Button>
          {!isEditMode ? (
            <Button asChild>
              <Link href={`/portal/dashboards/${dashboard.id}?mode=edit`}>
                Edit dashboard
              </Link>
            </Button>
          ) : null}
        </>
      }
    >
      {isEditMode ? (
        <DashboardEditor
          dashboard={dashboard}
          previewHref={`/portal/dashboards/${dashboard.id}`}
          selectedDashboardId={selected.dashboardId}
          widgets={widgets}
          datasets={datasets}
          datasetPreviews={datasetPreviews}
          shareSubjects={share.subjects}
        />
      ) : (
        <DashboardPreview
          widgets={widgets}
          datasets={datasets}
          datasetPreviews={datasetPreviews}
          datasetDetails={datasetDetails}
        />
      )}
    </PortalShell>
  );
}
