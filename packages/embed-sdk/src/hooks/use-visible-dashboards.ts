import type { VisibleDashboard } from "../../../../contracts/src/embed-viewer";

export async function listVisibleDashboards(_: { appId: string }) {
  return [] as VisibleDashboard[];
}
