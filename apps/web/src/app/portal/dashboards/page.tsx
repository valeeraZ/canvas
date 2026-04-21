import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readPortalSession } from "../../../lib/portal/session";

export default async function PortalDashboardsPage() {
  const session = readPortalSession(await cookies());

  if (!session) {
    redirect("/portal/login");
  }

  redirect(`/portal/${session.selectedApp}`);
}
