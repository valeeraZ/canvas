import { buildDashboardRecord } from "../../../../../../packages/db/src/dashboard-repository.js";

export async function createDashboard(input: {
  tenantId: string;
  name: string;
  workbookId?: string;
}) {
  return buildDashboardRecord(input);
}
