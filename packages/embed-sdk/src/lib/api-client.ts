export async function exchangeSession(_: {
  exchangeUrl: string;
  signedAssertion: string;
}) {
  return { status: "ready" as const };
}

type FetchLike = typeof fetch;

export async function listVisibleDashboards(input?: {
  baseUrl?: string;
  fetchImpl?: FetchLike;
}) {
  const fetchImpl = input?.fetchImpl ?? fetch;
  const baseUrl = input?.baseUrl ?? "";
  const response = await fetchImpl(`${baseUrl}/api/canvas/dashboards`);
  const payload = (await response.json()) as {
    dashboards: Array<{ id: string; name: string }>;
  };

  return payload.dashboards;
}

export async function getSelectedDashboard(input?: {
  baseUrl?: string;
  fetchImpl?: FetchLike;
}) {
  const fetchImpl = input?.fetchImpl ?? fetch;
  const baseUrl = input?.baseUrl ?? "";
  const response = await fetchImpl(
    `${baseUrl}/api/canvas/dashboards/selected-dashboard`
  );

  return response.json() as Promise<{
    dashboardId: string | null;
  }>;
}

export async function setSelectedDashboard(input: {
  dashboardId: string | null;
  baseUrl?: string;
  fetchImpl?: FetchLike;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const baseUrl = input.baseUrl ?? "";
  const response = await fetchImpl(
    `${baseUrl}/api/canvas/dashboards/selected-dashboard`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        dashboardId: input.dashboardId
      })
    }
  );

  return response.json() as Promise<{
    dashboardId: string | null;
  }>;
}
