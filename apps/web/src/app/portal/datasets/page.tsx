import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveAccessibleAppSession } from "../../../lib/portal/accessible-app";
import { createPortalBackendClient } from "../../../lib/portal/backend-client";
import { readPortalSession } from "../../../lib/portal/session";

export default async function PortalDatasetsPage() {
  const session = readPortalSession(await cookies());

  if (!session) {
    redirect("/portal/login");
  }

  const authClient = createPortalBackendClient(session);
  const accessibleApps = await authClient.listAccessibleApps();
  const { activeApp } = resolveAccessibleAppSession(
    session,
    accessibleApps.apps
  );

  redirect(activeApp ? `/portal/${activeApp.appName}/datasets` : "/portal");
}
