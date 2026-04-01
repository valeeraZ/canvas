"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { type PortalApiError, toPortalApiError } from "../../lib/portal/api-client";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

export function PortalActionAlert(props: {
  error: PortalApiError | Error | string | null;
  title?: string;
}) {
  if (!props.error) {
    return null;
  }

  const error =
    typeof props.error === "string"
      ? toPortalApiError(new Error(props.error))
      : toPortalApiError(props.error);

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{props.title ?? "Action failed"}</AlertTitle>
      <AlertDescription>
        <p>We couldn&apos;t complete this action. Please try again.</p>
        {error.requestId ? <p>Request ID: {error.requestId}</p> : null}
      </AlertDescription>
    </Alert>
  );
}
