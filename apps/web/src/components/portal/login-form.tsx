"use client";

import React, { startTransition, useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";
import {
  createPortalApiClient,
  type PortalApiError,
  toPortalApiError
} from "../../lib/portal/api-client";
import { PortalActionAlert } from "./portal-action-alert";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function LoginForm(props: { defaultApp: string }) {
  const apiClient = createPortalApiClient();
  const [token, setToken] = useState("local-dev-token");
  const [appName, setAppName] = useState(props.defaultApp);
  const [error, setError] = useState<PortalApiError | null>(null);
  const [pending, setPending] = useState(false);

  function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    startTransition(async () => {
      try {
        await apiClient.createSession({
          token,
          appName
        });

        window.location.href = "/portal";
      } catch (caught) {
        setError(toPortalApiError(caught));
      } finally {
        setPending(false);
      }
    });
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Sign in to Canvas</CardTitle>
        <CardDescription>
          Start a Canvas server session with your amtoken, then choose the app you
          want to manage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={submitForm}>
          <div className="grid gap-2">
            <Label htmlFor="amtoken">amtoken</Label>
            <Input
              id="amtoken"
              name="amtoken"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Paste the upstream amtoken"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="appName">Default app</Label>
            <Input
              id="appName"
              name="appName"
              value={appName}
              onChange={(event) => setAppName(event.target.value)}
              placeholder="canvas"
            />
          </div>
          {error ? (
            <PortalActionAlert error={error} title="Login failed" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Local development defaults to a mock profile when external auth is not
              reachable.
            </p>
          )}
          <Button className="w-full sm:w-auto" type="submit" disabled={pending}>
            {pending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Start Canvas Session
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
