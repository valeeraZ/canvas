import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DatasetDetail } from "../../../../components/portal/dataset-detail";
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

export default async function PortalDatasetDetailPage(props: {
  params: Promise<{
    datasetId: string;
  }>;
}) {
  const session = readPortalSession(await cookies());

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to review dataset details</CardTitle>
            <CardDescription>
              Dataset detail views depend on the current Canvas portal session.
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

  const { datasetId } = await props.params;
  const client = createPortalBackendClient(session);
  const [accessibleApps, dataset] = await Promise.all([
    client.listAccessibleApps(),
    client.getDataset(datasetId).catch(() => null)
  ]);

  if (!dataset) {
    notFound();
  }

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={session.selectedApp}
      principal={session.principal}
      title={dataset.name}
      description="Review upload metadata and downstream usage for this dataset in the current app."
      currentSection="datasets"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Datasets", href: "/portal/datasets" },
        { label: dataset.name }
      ]}
      actions={
        <Button asChild variant="outline">
          <Link href="/portal/datasets">Back to datasets</Link>
        </Button>
      }
    >
      <DatasetDetail dataset={dataset} />
    </PortalShell>
  );
}
