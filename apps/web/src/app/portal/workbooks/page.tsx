import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { CreateWorkbookDialog } from "../../../components/portal/create-workbook-dialog";
import { PortalShell } from "../../../components/portal/portal-shell";
import { WorkbookList } from "../../../components/portal/workbook-list";
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

export default async function PortalWorkbooksPage() {
  const session = readPortalSession(await cookies());

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in to review workbooks</CardTitle>
            <CardDescription>
              Workbook inventory uses the current Canvas portal session.
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
  const [accessibleApps, workbooks] = await Promise.all([
    client.listAccessibleApps(),
    client.listWorkbooks()
  ]);

  return (
    <PortalShell
      apps={accessibleApps.apps.map((app) => app.appName)}
      currentApp={session.selectedApp}
      principal={session.principal}
      title="Workbooks"
      description="Inspect workbook inventory for the active app and validate the structural layer behind dashboards."
      currentSection="workbooks"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Workbooks" }
      ]}
      actions={
        <CreateWorkbookDialog />
      }
    >
      <WorkbookList
        workbooks={workbooks.map((workbook) => ({
          id: workbook.id,
          name: workbook.name
        }))}
        actions={<CreateWorkbookDialog />}
      />
    </PortalShell>
  );
}
