import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { LoginForm } from "../../components/portal/login-form";
import { PortalShell } from "../../components/portal/portal-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { readPortalSession } from "../../lib/portal/session";

export default async function PortalHomePage() {
  const cookieStore = await cookies();
  const session = readPortalSession(cookieStore);

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-dashed bg-canvas-panel-muted">
            <CardHeader>
              <CardTitle className="text-3xl">Sign in to Canvas</CardTitle>
              <CardDescription>
                Start with an amtoken, establish a Canvas session, and then manage
                dashboards app by app.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-canvas-muted">
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
    />
  );
}
