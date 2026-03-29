"use client";

import React, { startTransition, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPortalApiClient } from "../../lib/portal/api-client";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";

export function AppSwitcher(props: {
  apps: string[];
  currentApp: string;
}) {
  const router = useRouter();
  const apiClient = createPortalApiClient();
  const [nextApp, setNextApp] = useState(props.currentApp);
  const [pending, setPending] = useState(false);

  function switchApp() {
    if (nextApp === props.currentApp) {
      return;
    }

    setPending(true);

    startTransition(async () => {
      try {
        await apiClient.selectApp({
          appName: nextApp
        });
        router.refresh();
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Active Canvas app</h2>
          <p className="text-xs text-muted-foreground">
            Switch active app without re-entering the amtoken.
          </p>
        </div>
        <Badge variant="outline" className="bg-sidebar/20 text-sidebar-foreground">
          {props.currentApp}
        </Badge>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="portal-app-switcher" className="text-xs text-sidebar-foreground/70">
          Switch active app
        </Label>
        <div className="grid gap-2">
          <Select value={nextApp} onValueChange={setNextApp}>
            <SelectTrigger
              id="portal-app-switcher"
              className="h-9 w-full rounded-xl border-sidebar-border bg-sidebar-accent px-3 text-sidebar-foreground"
            >
              <SelectValue placeholder="Choose an app" />
            </SelectTrigger>
            <SelectContent>
              {props.apps.map((app) => (
                <SelectItem key={app} value={app}>
                  {app}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="justify-center rounded-xl border border-sidebar-border bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
            onClick={switchApp}
            disabled={pending || nextApp === props.currentApp}
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Apply app
          </Button>
        </div>
      </div>
    </section>
  );
}
