import React from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, ShieldCheck } from "lucide-react";
import { AppSwitcher } from "./app-switcher";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Separator } from "../ui/separator";

export function PortalShell(props: {
  apps: string[];
  currentApp: string;
  principal?: {
    displayName: string;
    employeeId: string;
    roles: string[];
  } | null;
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden">
            <CardHeader className="gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-3xl">Canvas Portal</CardTitle>
                  <CardDescription className="mt-1">
                    Manage dashboards, app visibility, and embed defaults for the
                    currently active Canvas app.
                  </CardDescription>
                </div>
                <Badge variant="accent">App scoped</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6">
              <AppSwitcher apps={props.apps} currentApp={props.currentApp} />
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-canvas-panel-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Current app</CardTitle>
                    <CardDescription>
                      The active app context stored in the Canvas session.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-lg font-semibold">{props.currentApp}</p>
                  </CardContent>
                </Card>
                <Card className="bg-canvas-panel-muted">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Dashboard management</CardTitle>
                    <CardDescription>
                      Jump straight into dashboard list, sharing, and embed selection.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild>
                      <Link href="/portal/dashboards">
                        Open dashboards
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-canvas-accent" />
                Current principal
              </CardTitle>
              <CardDescription>
                Principal details resolved from the upstream authorization service.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p>
                <span className="font-medium">Display name:</span>{" "}
                {props.principal?.displayName ?? "Not signed in"}
              </p>
              <p>
                <span className="font-medium">Employee ID:</span>{" "}
                {props.principal?.employeeId ?? "Unavailable"}
              </p>
              <div className="flex flex-wrap gap-2">
                {(props.principal?.roles ?? []).length ? (
                  props.principal?.roles.map((role) => (
                    <Badge key={role}>{role}</Badge>
                  ))
                ) : (
                  <Badge variant="warning">No roles loaded</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutDashboard className="h-4 w-4 text-canvas-accent" />
              What you can do next
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-canvas-muted">
            <p>Open the dashboard list, review who can see each dashboard, and mark one as the current embed choice.</p>
            <p>Export and import affordances stay visible in the detail view, but they remain placeholders until the backend workflow is ready.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
