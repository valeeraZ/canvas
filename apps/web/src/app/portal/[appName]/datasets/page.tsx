import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { CreateDatasetUploadDialog } from "../../../../components/portal/create-dataset-upload-dialog";
import { DatasetList } from "../../../../components/portal/dataset-list";
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
import { scopePortalSession } from "../../../../lib/portal/app-scope";
import { readPortalSession } from "../../../../lib/portal/session";

export default async function PortalAppDatasetsPage(props: {
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
            <CardTitle>Sign in to review datasets</CardTitle>
            <CardDescription>
              Dataset inventory uses the current Canvas portal session.
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
  const accessibleApps = await client.listAccessibleApps();
  const activeApp = accessibleApps.apps.find((app) => app.appName === appName);

  if (!activeApp) {
    notFound();
  }

  const appOptions = accessibleApps.apps.filter((app) => app.roles.length > 0);
  const datasets = (
    await Promise.all(
      appOptions.map(async (app) => {
        const appSession = scopePortalSession(session, app.appName);
        return createPortalBackendClient(appSession)
          .listDatasets()
          .catch(() => []);
      })
    )
  )
    .flat()
    .sort((left, right) => left.name.localeCompare(right.name));
  const appLabels = Object.fromEntries(
    accessibleApps.apps.map((app) => [app.appName, app.appDisplayName ?? app.appName])
  );

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={activeApp.appDisplayName ?? activeApp.appName}
      principal={session.principal}
      title="Datasets"
      description="Inspect dataset ingestion health and warning counts for the active app."
      currentSection="datasets"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: activeApp.appDisplayName ?? activeApp.appName, href: `/portal/${appName}` },
        { label: "Datasets" }
      ]}
    >
      <DatasetList
        appName={appName}
        datasets={datasets}
        appLabels={appLabels}
        actions={
          <CreateDatasetUploadDialog
            appOptions={appOptions.map((app) => ({
              appName: app.appName,
              appDisplayName: app.appDisplayName ?? app.appName
            }))}
          />
        }
      />
    </PortalShell>
  );
}
