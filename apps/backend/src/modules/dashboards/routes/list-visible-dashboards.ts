import type { DashboardRecord } from "../../../../../../packages/contracts/src/dashboards";

export async function listVisibleDashboards(_: {
  principalId: string;
  appId: string;
}): Promise<DashboardRecord[]> {
  return [];
}
