import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { CreateDatasetUploadDialog } from "../../../components/portal/create-dataset-upload-dialog";
import { DatasetList } from "../../../components/portal/dataset-list";
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

export default async function PortalDatasetsPage() {
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

  const client = createPortalBackendClient(session);
  const [accessibleApps, datasets] = await Promise.all([
    client.listAccessibleApps(),
    client.listDatasets()
  ]);

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={session.selectedApp}
      principal={session.principal}
      title="Datasets"
      description="Inspect dataset ingestion health and warning counts for the active app."
      currentSection="datasets"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Datasets" }
      ]}
    >
      <DatasetList
        datasets={datasets}
        actions={<CreateDatasetUploadDialog />}
      />
    </PortalShell>
  );
}
