import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readPortalSession } from "../../../../lib/portal/session";

export default async function PortalDashboardDetailPage(props: {
  params: Promise<{
    dashboardId: string;
  }>;
  searchParams?: Promise<{
    mode?: string;
  }>;
}) {
  const session = readPortalSession(await cookies());

  if (!session) {
    redirect("/portal/login");
  }

  const { dashboardId } = await props.params;
  const searchParams = await props.searchParams;
  const query = searchParams?.mode === "edit" ? "?mode=edit" : "";
  redirect(`/portal/${session.selectedApp}/${dashboardId}${query}`);
}
