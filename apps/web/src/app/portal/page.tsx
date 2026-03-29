import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "../../components/portal/login-form";
import { PortalShell } from "../../components/portal/portal-shell";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { readPortalSession } from "../../lib/portal/session";

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

  return (
    <PortalShell
      apps={[session.selectedApp, "canvas", "canvas-ops"].filter(
        (value, index, items) => items.indexOf(value) === index
      )}
      currentApp={session.selectedApp}
      principal={session.principal}
      title="Portal overview"
      description="Operate Canvas at app scope: inspect the current session, move between apps, and manage the dashboards that each user can see."
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
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1">
                <CardTitle>Session summary</CardTitle>
                <CardDescription>
                  The Portal resolves external authorization from your amtoken and
                  pins the current app in a Canvas-managed server session.
                </CardDescription>
              </div>
              <Badge variant="secondary">Live app context</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="size-4 text-muted-foreground" />
                Principal
              </div>
              <div className="grid gap-1 text-sm">
                <span className="font-medium">{session.principal.displayName}</span>
                <span className="text-muted-foreground">
                  Employee ID: {session.principal.employeeId}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4 text-muted-foreground" />
                Current app
              </div>
              <div className="grid gap-2 text-sm">
                <span className="font-medium">{session.selectedApp}</span>
                <span className="text-muted-foreground">
                  Stored in Canvas session cookie
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <LayoutDashboard className="size-4 text-muted-foreground" />
                Roles
              </div>
              <div className="flex flex-wrap gap-2">
                {session.principal.roles.map((role) => (
                  <Badge key={role} variant="outline">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <CardDescription>
              Start with dashboard inventory, then review sharing and embed selection.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button asChild variant="secondary" className="justify-between">
              <Link href="/portal/dashboards">
                Manage dashboards
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Export and import remain visible in the dashboard detail flow, so the
              main console stays focused on inventory and visibility.
            </div>
          </CardContent>
        </Card>
      </section>
    </PortalShell>
  );
}
