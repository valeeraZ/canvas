import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import { AppInventory } from "../../components/portal/app-inventory";
import { LoginForm } from "../../components/portal/login-form";
import { PortalShell } from "../../components/portal/portal-shell";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { createPortalBackendClient } from "../../lib/portal/backend-client";
import { readPortalSession } from "../../lib/portal/session";

function sortAppNamesByRecent(apps: string[], recentApps: string[]) {
  const recentOrder = new Map(
    recentApps.map((appName, index) => [appName, index] as const)
  );

  return [...apps].sort((left, right) => {
    const leftRank = recentOrder.get(left);
    const rightRank = recentOrder.get(right);

    if (leftRank !== undefined && rightRank !== undefined) {
      return leftRank - rightRank;
    }

    if (leftRank !== undefined) {
      return -1;
    }

    if (rightRank !== undefined) {
      return 1;
    }

    return left.localeCompare(right);
  });
}

export default async function PortalHomePage() {
  const cookieStore = await cookies();
  const session = readPortalSession(cookieStore);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-dashed bg-muted/40">
            <CardHeader>
              <CardTitle className="text-3xl">Sign in to Canvas</CardTitle>
              <CardDescription>
                Start with an amtoken, establish a Canvas session, and then manage
                dashboards app by app.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground">
              <p>The Portal keeps the current app in a server-side session and uses your amtoken to resolve user context.</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/portal/login">Go to login</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <LoginForm defaultApp="canvas" />
        </section>
      </main>
    );
  }

  const authClient = createPortalBackendClient(session);
  const accessibleAppsResponse = await authClient.listAccessibleApps();
  const orderedApps = sortAppNamesByRecent(
    accessibleAppsResponse.apps.map((app) => app.appName),
    session.recentApps ?? []
  );
  const appsByName = new Map(
    accessibleAppsResponse.apps.map((app) => [app.appName, app] as const)
  );
  const inventory = await Promise.all(
    orderedApps.map(async (appName) => {
      const appClient = createPortalBackendClient({
        ...session,
        selectedApp: appName
      });
      const [dashboards, workbooks] = await Promise.all([
        appClient.listDashboards(),
        appClient.listWorkbooks()
      ]);
      const recentDashboardId = session.recentDashboardsByApp?.[appName];
      const recentWorkbookId = session.recentWorkbooksByApp?.[appName];
      const recentDashboard =
        dashboards.find((dashboard) => dashboard.id === recentDashboardId) ??
        dashboards[0] ??
        null;
      const recentWorkbook =
        workbooks.find((workbook) => workbook.id === recentWorkbookId) ??
        workbooks[0] ??
        null;

      return {
        appName,
        roles: appsByName.get(appName)?.roles ?? [],
        recentDashboardName: recentDashboard?.name ?? null,
        recentWorkbookName: recentWorkbook?.name ?? null
      };
    })
  );

  return (
    <PortalShell
      apps={orderedApps}
      currentApp={session.selectedApp}
      principal={session.principal}
      title="Your apps"
      description="Start from the apps you can access, then enter an app to manage its dashboards and workbooks."
      currentSection="overview"
      breadcrumbs={[
        { label: "Portal", href: "/portal" },
        { label: "Overview" }
      ]}
      actions={
        <Button asChild>
          <Link href="/portal/dashboards">
            Open dashboards
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Apps overview</CardTitle>
            <CardDescription>
              Recently used apps float to the top so you can jump back into active
              dashboard and workbook management quickly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AppInventory apps={inventory} />
          </CardContent>
        </Card>
      </section>
    </PortalShell>
  );
}
