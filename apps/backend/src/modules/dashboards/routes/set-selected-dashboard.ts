export async function getSelectedDashboard(input: {
  appId: string;
  externalUserId: string;
  findPrincipalByExternalUserId: (externalUserId: string) => Promise<{
    id: string;
    externalUserId: string;
  } | null>;
  getPreference: (input: {
    principalId: string;
    appId: string;
  }) => Promise<{
    selectedDashboardId: string | null;
  } | null>;
}) {
  const principal = await input.findPrincipalByExternalUserId(
    input.externalUserId
  );

  if (!principal) {
    return {
      dashboardId: null
    };
  }

  const preference = await input.getPreference({
    principalId: principal.id,
    appId: input.appId
  });

  return {
    dashboardId: preference?.selectedDashboardId ?? null
  };
}

export async function setSelectedDashboard(input: {
  appId: string;
  externalUserId: string;
  dashboardId: string | null;
  upsertPrincipal: (input: { externalUserId: string }) => Promise<{
    id: string;
    externalUserId: string;
  }>;
  setPreference: (input: {
    principalId: string;
    appId: string;
    selectedDashboardId: string | null;
  }) => Promise<{
    selectedDashboardId: string | null;
  }>;
}) {
  const principal = await input.upsertPrincipal({
    externalUserId: input.externalUserId
  });

  const preference = await input.setPreference({
    principalId: principal.id,
    appId: input.appId,
    selectedDashboardId: input.dashboardId
  });

  return {
    dashboardId: preference.selectedDashboardId
  };
}
