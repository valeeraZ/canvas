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
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Active Canvas app</h2>
          <p className="text-sm text-canvas-muted">
            Switch active app without re-entering the amtoken.
          </p>
        </div>
        <Badge variant="accent">{props.currentApp}</Badge>
      </div>
      <div className="grid gap-2 sm:max-w-sm">
        <Label htmlFor="portal-app-switcher">Switch active app</Label>
        <div className="flex gap-2">
          <Select value={nextApp} onValueChange={setNextApp}>
            <SelectTrigger id="portal-app-switcher" className="bg-canvas-panel">
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
            variant="outline"
            onClick={switchApp}
            disabled={pending || nextApp === props.currentApp}
          >
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Update
          </Button>
        </div>
      </div>
    </section>
  );
}
