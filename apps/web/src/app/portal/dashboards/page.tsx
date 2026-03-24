import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { DashboardList } from "../../../components/portal/dashboard-list";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../../components/ui/card";
import { getPortalDemoStore } from "../../../lib/portal/demo-store";
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

  const store = getPortalDemoStore();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-canvas-muted">Active app</p>
          <h1 className="text-3xl font-semibold">{session.selectedApp}</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/portal">Back to portal</Link>
        </Button>
      </div>
      <DashboardList
        dashboards={store.dashboards}
        selectedDashboardId={store.selectedDashboardId}
      />
    </main>
  );
}
